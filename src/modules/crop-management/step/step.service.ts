import { BadRequestException, HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, QueryFailedError, Repository, SelectQueryBuilder } from 'typeorm';
import { Step } from '../entities/step.entity';
import { SeasonDetail } from '../entities/season-detail.entity';
import { TriggerException } from 'src/database/utils/trigger.exception';
import { ResponseCode } from 'src/common/constants/response-code.const';
import { PaginationResult } from 'src/common/dtos/pagination/pagination-result.dto';
import { PublicStepDto, StepDto } from '../dtos/step/step.dto';
import { PaginationTransform } from 'src/common/dtos/pagination/pagination-option.dto';
import { plainToInstance } from 'class-transformer';
import { applyPagination } from 'src/common/utils/pagination.util';
import { PaginationMeta } from 'src/common/dtos/pagination/pagination-meta.dto';
import { AddStepDto } from '../dtos/season/add-step.dto';
import { CreateStepDto } from '../dtos/step/create-step.dto';
import { ListStepDto } from '../dtos/step/list-step.dto';
import { StepSortFields } from '../enums/step-sort-fields.enum';
import { Order } from 'src/common/enums/pagination.enum';
import { SeasonDetailDto } from '../dtos/step/season-detail.dto';
import { StepStatus } from '../enums/step-status.enum';
import { Season } from '../entities/season.entity';
import { BlockchainService } from '../blockchain/blockchain.service';

@Injectable()
export class StepService {

    private readonly logger = new Logger(StepService.name)

    constructor(
        @InjectRepository(SeasonDetail) private readonly seasonDetailRepository: Repository<SeasonDetail>,
        @InjectRepository(Step) private readonly stepRepository: Repository<Step>,
        private readonly blockchainService: BlockchainService,
        private readonly dataSource: DataSource,
    ) { }

    async addSeasonStep(addStepDto: AddStepDto): Promise<StepDto> {
        try {
            const result = await this.seasonDetailRepository.insert({ ...addStepDto });
            const { id } = result.identifiers[0];
            const queryBuilder = this.seasonDetailRepository.createQueryBuilder("season_detail")
                .addSelect([
                    "step.id",
                    "step.name",
                    "step.description",
                    "step.notes",
                    "step.type",
                    "step.order",
                ])
                .leftJoin("season_detail.step", "step")
                .where("season_detail.id = :id", { id })

            const res = await queryBuilder.getOne();
            if (!res) {
                throw new InternalServerErrorException({
                    message: "Failed to add step",
                    code: ResponseCode.FAILED_TO_ADD_STEP,
                })
            }
            return this.plainStepDto(res);
        }
        catch (error) {
            if (error instanceof QueryFailedError) {
                TriggerException.throwStepException(error);
            }
            this.logger.error("Failed to add step: ", error.message);
            throw new InternalServerErrorException({
                message: "Failed to add step",
                code: ResponseCode.FAILED_TO_ADD_STEP,
            })
        }
    }

    async getSeasonSteps(seasonId: number): Promise<StepDto[]> {
        // const paginationOptions = plainToInstance(PaginationTransform<string>, getStepDto);
        try {
            const queryBuilder = this.seasonDetailRepository.createQueryBuilder("season_detail")
                .addSelect([
                    "step.name",
                    "step.description",
                    "step.notes",
                    "step.type",
                    "step.order",
                ])
                .leftJoin("season_detail.step", "step")
                .where("season_detail.season_id = :seasonId", { seasonId })
                .orderBy("season_detail.updated", "DESC")

            // const totalItems = await applyPagination(queryBuilder, paginationOptions);

            const result = await queryBuilder.getMany();

            const steps = result.map((res): StepDto => this.plainStepDto(res));

            let hashedSteps: { id: number, hash: string }[] = [];
            try {
                hashedSteps = await this.blockchainService.getHashedSteps(seasonId);
            } catch (error) {
                this.logger.error("Failed to hashed steps: ", error.message);
            }

            hashedSteps.map((data) => {
                const step = steps.find((step) => step.id === data.id);
                if (step) {
                    step.verified = true
                }
            })

            return steps;
        }
        catch (error) {
            if (error instanceof HttpException) throw error;
            this.logger.error("Failed to get steps: ", error.message);
            throw new InternalServerErrorException({
                message: "Failed to get steps",
                code: ResponseCode.FAILED_TO_GET_STEPS
            })
        }
    }

    async createStep(createStepDto: CreateStepDto): Promise<Step> {
        try {
            return await this.stepRepository.save(createStepDto);
        }
        catch (error) {
            this.logger.error("Failed to create steps: ", error.message);
            throw new InternalServerErrorException({
                message: "Failed to create steps",
                code: ResponseCode.FAILED_TO_CREATE_STEP
            })
        }
    }


    async listSteps(listStepDto: ListStepDto): Promise<PaginationResult<Step>> {
        const paginationOptions = plainToInstance(PaginationTransform<StepSortFields>, listStepDto);
        const { sort_by, order } = paginationOptions;
        try {
            const queryBuilder = this.stepRepository.createQueryBuilder("step")
            this.applySorting(queryBuilder, sort_by, order);
            this.applyFilter(queryBuilder, listStepDto);

            const totalItems = await applyPagination(queryBuilder, paginationOptions);
            const steps = await queryBuilder.getMany();

            return new PaginationResult(steps, new PaginationMeta({
                paginationOptions,
                totalItems
            }))
        }
        catch (error) {
            if (error instanceof HttpException) throw error;
            this.logger.error("Failed to get steps: ", error.message);
            throw new InternalServerErrorException({
                message: "Failed to get steps",
                code: ResponseCode.FAILED_TO_GET_STEPS
            })
        }
    }

    async getStep(stepId: number): Promise<Step> {
        try {
            const result = await this.stepRepository.findOne({ where: { id: stepId } });
            if (!result) {
                throw new NotFoundException({
                    message: "Step not found",
                    code: ResponseCode.STEP_NOT_FOUND
                });
            }
            return result;
        }
        catch (error) {
            this.logger.error("Failed to get steps: ", error.message);
            throw new InternalServerErrorException({
                message: "Failed to get step",
                code: ResponseCode.FAILED_TO_GET_STEP
            })
        }
    }

    async listPublicStepsByCropId(listStepDto: ListStepDto, cropId: number): Promise<PaginationResult<PublicStepDto>> {
        const paginationOptions = plainToInstance(PaginationTransform<StepSortFields>, listStepDto);
        const { sort_by, order } = paginationOptions;
        try {
            const queryBuilder = this.stepRepository.createQueryBuilder("step")
                .where("step.crop_id = :id", { id: cropId })

            this.applyFilter(queryBuilder, listStepDto);
            this.applySorting(queryBuilder, sort_by, order);

            const totalItems = await applyPagination(queryBuilder, paginationOptions);

            const result = await queryBuilder.getMany();
            const steps = plainToInstance(PublicStepDto, result, { excludeExtraneousValues: true });

            return new PaginationResult(steps, new PaginationMeta({
                paginationOptions,
                totalItems
            }))
        }
        catch (error) {
            if (error instanceof HttpException) throw error;
            this.logger.error("Failed to get steps: ", error.message);
            throw new InternalServerErrorException({
                message: "Failed to get steps",
                code: ResponseCode.FAILED_TO_GET_STEPS
            })
        }
    }

    async getSeasonStep(seasonDetailId: number, manager?: EntityManager): Promise<StepDto> {
        const repo = manager ? manager.getRepository(SeasonDetail) : this.seasonDetailRepository;
        try {
            const result = await repo.findOne({
                where: { id: seasonDetailId }, relations: ["step"]
            });
            if (!result) {
                throw new NotFoundException({
                    message: "Failed to get step",
                    code: ResponseCode.FAILED_TO_GET_STEP
                })
            }
            return this.plainStepDto(result);
        }
        catch (error) {
            if (error instanceof HttpException) throw error;
            this.logger.error("Failed to get step: ", error.message);
            throw new InternalServerErrorException({
                message: "Failed to get step",
                code: ResponseCode.FAILED_TO_GET_STEP
            })
        }
    }

    async verifySeasonStep(seasonId: number, stepId: number): Promise<boolean> {
        try {
            const step = await this.seasonDetailRepository.findOne({ where: { season_id: seasonId, step_id: stepId } })
            if (!step) {
                throw new NotFoundException({
                    message: "Step not found",
                    code: ResponseCode.STEP_NOT_FOUND,
                })
            }
            if (!step.transaction_hash) {
                throw new BadRequestException({
                    message: "Step is not uploaded to blockchain",
                    code: ResponseCode.STEP_IS_NOT_UPLOADED,
                })
            }
            const hashedData = this.blockchainService.hashData(SeasonDetailDto, step);

            const blockchainHash = await this.blockchainService.getStep(seasonId, stepId);
            return hashedData === blockchainHash;
        }
        catch (error) {
            if (error instanceof HttpException) throw error;
            this.logger.error("Failed to verify step: ", error.message);
            throw new InternalServerErrorException({
                message: "Failed to verify step",
                code: ResponseCode.FAILED_TO_VERIFY_STEP
            })
        }
    }

    async updateSeasonStepStatus(seasonDetailId: number, status: StepStatus): Promise<boolean> {
        try {
            const result = await this.seasonDetailRepository.update(
                { id: seasonDetailId },
                { step_status: status }
            )
            if (result.affected && result.affected > 0) return true;
            throw new InternalServerErrorException();
        }
        catch (error) {
            throw new InternalServerErrorException({
                message: "Failed to update step",
                code: ResponseCode.FAILED_TO_UPDATE_STEP
            })
        }
    }

    async updateTransactionHash(seasonId: number, stepId: number, transactionHash: string, manager?: EntityManager): Promise<boolean> {
        try {
            const repo = manager ? manager.getRepository(SeasonDetail) : this.seasonDetailRepository;
            const result = await repo.update(
                { season_id: seasonId, step_id: stepId },
                { transaction_hash: transactionHash })
            if (result && result.affected && result.affected > 0) {
                return true;
            }
            throw new InternalServerErrorException()
        }
        catch (error) {
            throw new InternalServerErrorException({
                message: "Failed to update step transaction hash",
                code: ResponseCode.FAILED_TO_UPDATE_STEP
            })
        }
    }

    async validateAddSeasonStep(season: Season, stepId: number): Promise<void> {
        // validate crop type
        const step = await this.getStep(stepId);

        if (step.crop_id != season.plot.crop_id) throw new BadRequestException({
            message: "Invalid step for crop",
            code: ResponseCode.INVALID_STEP_FOR_CROP
        });

        const queryBuilder = this.seasonDetailRepository
            .createQueryBuilder('season_detail')
            .innerJoin('season_detail.step', 'step')
            .select('MAX(step."order")', 'prev_step_order')
            .addSelect('season_detail.step_status', 'prev_step_status')
            .where('season_detail.season_id = :seasonId', { seasonId: season.id })
            .groupBy('season_detail.step_status')
            .limit(1);

        const validator = await queryBuilder.getRawOne();

        const prevStepOrder = validator?.prev_step_order;
        const prevStepStatus = validator?.prev_step_status;

        if (prevStepOrder && !step.repeated && (
            prevStepOrder >= step.order ||
            Math.floor(step.order / 10) > Math.floor(prevStepOrder / 10) + 1
        )) {
            throw new BadRequestException({
                message: `Invalid step order`,
                code: ResponseCode.INVALID_STEP_ORDER,
            })
        }

        if (prevStepStatus && prevStepStatus !== StepStatus.DONE) {
            throw new BadRequestException({
                message: 'Previous step is in process',
                code: ResponseCode.PREVIOUS_STEP_IN_PROGRESS,
            });
        }

        // if (!prevStepOrder) {
        //     if (season.plot.crop_type === CropType.SHORT_TERM) {
        //         const firstStep = await this.stepRepository.findOne({
        //             select: ["order"],
        //             where: { for_crop_type: CropType.SHORT_TERM },
        //             order: { order: "ASC" }
        //         });
        //         if (!firstStep) throw new InternalServerErrorException({
        //             message: "Internal server errror",
        //             code: ResponseCode.INTERNAL_ERROR
        //         });
        //         if (firstStep.order != step.order) throw new BadRequestException({
        //             message: `Invalid first step`,
        //             code: ResponseCode.INVALID_FIRST_STEP,
        //         });
        //     }
        //     else if (season.plot.crop_type === CropType.LONG_TERM) {
        //         const firstStep = await this.stepRepository
        //             .createQueryBuilder('step')
        //             .select('step.order')
        //             .where('step.for_crop_type = :crop_type', { crop_type: CropType.LONG_TERM })
        //             .andWhere('step.order % 10 != 0')
        //             .andWhere('step.type = :type', { type: StepType.CARE })
        //             .orderBy('step.order', 'ASC')
        //             .getOne();

        //         if (!firstStep) throw new InternalServerErrorException({
        //             message: "Internal server errror",
        //             code: ResponseCode.INTERNAL_ERROR
        //         });
        //         if (step.order > firstStep.order) throw new BadRequestException({
        //             message: `Invalid first step`,
        //             code: ResponseCode.INVALID_FIRST_STEP,
        //         });
        //     }
        // }
    }

    async getSeasonDetailForValidateAddLog(seasonDetailId: number): Promise<SeasonDetail> {
        try {
            const queryBuilder = this.seasonDetailRepository.createQueryBuilder("season_detail")
                .addSelect([
                    "season_detail.step_status",
                    "step.min_logs",
                ])
                .leftJoin("season_detail.step", "step")
                .where("season_detail.id = :id", { id: seasonDetailId })

            const result = await queryBuilder.getOne();
            if (!result) {
                throw new InternalServerErrorException({
                    message: "Season detail not found",
                    code: ResponseCode.STEP_NOT_FOUND,
                })
            }
            return result;
        }
        catch (error) {
            if (error instanceof HttpException) throw error;
            this.logger.error("Failed to get step: ", error.message);
            throw new InternalServerErrorException({
                message: "Failed to get step",
                code: ResponseCode.FAILED_TO_GET_STEP
            })
        }
    }

    async updateInactiveLogNum(id: number, manager?: EntityManager): Promise<void> {
        const repo = manager ? manager.getRepository(SeasonDetail) : this.seasonDetailRepository;
        try {
            const seasonDetail = await repo.findOne({ where: { id: id } });
            if (!seasonDetail) throw new InternalServerErrorException();
            if (seasonDetail.step_status === StepStatus.DONE) throw new BadRequestException({
                message: "Can not update finished step",
                code: ResponseCode.STEP_ALREADY_DONE
            })
            seasonDetail.inactive_logs += 1;
            await repo.save(seasonDetail);
        } catch (error) {
            throw new InternalServerErrorException({
                message: "Failed to get update season step",
                code: ResponseCode.FAILED_TO_UPDATE_STEP
            })
        }
    }

    private applySorting(qb: SelectQueryBuilder<Step>, sortBy: StepSortFields, order: Order) {
        switch (sortBy) {
            case StepSortFields.NAME:
                qb.orderBy('step.name', order);
                break;
            case StepSortFields.UPDATED:
                qb.orderBy('step.updated', order);
                break;
            case StepSortFields.ORDER:
                qb.orderBy('step.order', order);
                break;
            default:
                qb.orderBy('step.id', order);
        }
    }

    private applyFilter(qb: SelectQueryBuilder<Step>, listStepDto: ListStepDto) {
        if (listStepDto.search) {
            const search = listStepDto.search.trim();
            qb.andWhere("step.name ILIKE :search", { search: `%${search}%` })
        }
        if (listStepDto.type) {
            const type = listStepDto.type;
            qb.andWhere("step.type = :type", { type })
        }
    }

    private plainStepDto(s: SeasonDetail) {
        return plainToInstance(
            StepDto,
            {
                step_name: s.step.name,
                step_description: s.step.description,
                step_type: s.step.type,
                step_order: s.step.order,
                ...s
            },
            { excludeExtraneousValues: true }
        );
    }
}
