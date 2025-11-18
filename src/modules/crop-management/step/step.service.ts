import { BadRequestException, HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository, SelectQueryBuilder } from 'typeorm';
import { Step } from '../entities/step.entity';
import { SeasonDetail } from '../entities/season-detail.entity';
import { TriggerException } from 'src/database/utils/trigger.exception';
import { ResponseCode } from 'src/common/constants/response-code.const';
import { GetStepDto } from '../dtos/step/get-step.dto';
import { PaginationResult } from 'src/common/dtos/pagination/pagination-result.dto';
import { PublicStepDto, StepDto } from '../dtos/step/step.dto';
import { PaginationTransform } from 'src/common/dtos/pagination/pagination-option.dto';
import { plainToInstance } from 'class-transformer';
import { applyPagination } from 'src/common/utils/pagination.util';
import { PaginationMeta } from 'src/common/dtos/pagination/pagination-meta.dto';
import { addStepDto } from '../dtos/season/add-step.dto';
import { CreateStepDto } from '../dtos/step/create-step.dto';
import { ListStepDto } from '../dtos/step/list-step.dto';
import { StepSortFields } from '../enums/step-sort-fields.enum';
import { Order } from 'src/common/enums/pagination.enum';
import { BlockchainService } from 'src/services/blockchain.service';
import { SeasonDetailDto } from '../dtos/step/season-detail.dto';

@Injectable()
export class StepService {

    private readonly logger = new Logger(StepService.name)

    constructor(
        @InjectRepository(SeasonDetail) private readonly seasonDetailRepository: Repository<SeasonDetail>,
        @InjectRepository(Step) private readonly stepRepository: Repository<Step>,
        private readonly blockchainService: BlockchainService,
    ) { }

    async addStep(seasonId: number, addStepDto: addStepDto): Promise<StepDto> {
        try {
            const result = await this.seasonDetailRepository.insert({ ...addStepDto, season_id: seasonId });
            const { season_id, step_id } = result.identifiers[0];
            const queryBuilder = this.seasonDetailRepository.createQueryBuilder("season_detail")
                .addSelect([
                    "step.id",
                    "step.name",
                    "step.description",
                    "step.notes",
                    "step.for_crop_type",
                    "step.type"
                ])
                .leftJoin("season_detail.step", "step")
                .where("season_detail.season_id = :season_id", { season_id })
                .andWhere("season_detail.step_id = :step_id", { step_id })

            const res = await queryBuilder.getOne();
            if (!res) {
                throw new InternalServerErrorException({
                    message: "Failed to add step",
                    code: ResponseCode.FAILED_TO_ADD_STEP,
                })
            }
            return plainToInstance(
                StepDto,
                {
                    step_name: res.step.name,
                    step_description: res.step.description,
                    step_for_crop_type: res.step.for_crop_type,
                    step_type: res.step.type,
                    ...res
                },
                { excludeExtraneousValues: true }
            );
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

    async getSteps(seasonId: number, getStepDto: GetStepDto): Promise<PaginationResult<StepDto>> {
        const paginationOptions = plainToInstance(PaginationTransform<string>, getStepDto);
        try {
            const queryBuilder = this.seasonDetailRepository.createQueryBuilder("season_detail")
                .addSelect([
                    "step.name",
                    "step.description",
                    "step.notes",
                    "step.for_crop_type",
                    "step.type"
                ])
                .leftJoin("season_detail.step", "step")
                .where("season_detail.season_id = :seasonId", { seasonId })
                .orderBy("season_detail.created")

            const totalItems = await applyPagination(queryBuilder, paginationOptions);

            const result = await queryBuilder.getMany();
            const steps = plainToInstance(
                StepDto,
                result.map((res): StepDto => ({
                    step_name: res.step.name,
                    step_description: res.step.description,
                    step_for_crop_type: res.step.for_crop_type,
                    step_type: res.step.type,
                    ...res
                })),
                { excludeExtraneousValues: true }
            );

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

    async listPublicSteps(listStepDto: ListStepDto): Promise<PaginationResult<PublicStepDto>> {
        const paginationOptions = plainToInstance(PaginationTransform<StepSortFields>, listStepDto);
        const { sort_by, order } = paginationOptions;
        try {
            const queryBuilder = this.stepRepository.createQueryBuilder("step")
            this.applySorting(queryBuilder, sort_by, order);
            this.applyFilter(queryBuilder, listStepDto);

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

    async getStep(seasonId: number, stepId: number): Promise<SeasonDetail> {
        try {
            const result = await this.seasonDetailRepository.findOne({
                where: { season_id: seasonId, step_id: stepId }
            });
            if (!result) {
                throw new NotFoundException({
                    message: "Failed to get step",
                    code: ResponseCode.FAILED_TO_GET_STEP
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

    async verifyStep(seasonId: number, stepId: number): Promise<boolean> {
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
                code: ResponseCode.PREVIOUS_VERIFY_STEP
            })
        }
    }

    async updateTransactionHash(seasonId: number, stepId: number, transactionHash: string): Promise<boolean> {
        try {
            const result = await this.seasonDetailRepository.update(
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

    private applySorting(qb: SelectQueryBuilder<Step>, sortBy: StepSortFields, order: Order) {
        switch (sortBy) {
            case StepSortFields.NAME:
                qb.orderBy('step.name', order);
                break;
            case StepSortFields.UPDATED:
                qb.orderBy('step.updated', order);
                break;
            default:
                qb.orderBy('step.id', order);
        }
    }

    private applyFilter(qb: SelectQueryBuilder<Step>, listStepDto: ListStepDto) {
        if (listStepDto.for_crop_type) {
            const type = listStepDto.for_crop_type;
            qb.andWhere("step.for_crop_type = :type", { type })
        }
        if (listStepDto.type) {
            const type = listStepDto.type;
            qb.andWhere("step.type = :type", { type })
        }
    }
}
