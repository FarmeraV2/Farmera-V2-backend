import { BadRequestException, forwardRef, HttpException, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, QueryFailedError, Repository } from 'typeorm';
import { Season } from '../entities/season.entity';
import { CreateSeasonDto } from '../dtos/season/create-season.dto';
import { SeasonStatus } from '../enums/season-status.enum';
import { UpdateSeasonDto } from '../dtos/season/update-season.dto';
import { PaginationTransform } from 'src/common/dtos/pagination/pagination-option.dto';
import { PaginationResult } from 'src/common/dtos/pagination/pagination-result.dto';
import { PaginationMeta } from 'src/common/dtos/pagination/pagination-meta.dto';
import { ResponseCode } from 'src/common/constants/response-code.const';
import { SeasonDetailDto, seasonDetailSelectFields, SeasonDto, seasonSelectFields } from '../dtos/season/season.dto';
import { TriggerException } from 'src/database/utils/trigger.exception';
import { StepService } from '../step/step.service';
import { StepDto } from '../dtos/step/step.dto';
import { LogService } from '../log/log.service';
import { Log } from '../entities/log.entity';
import { GetSeasonDto } from '../dtos/season/get-season.dto';
import { plainToInstance } from 'class-transformer';
import { SeasonSortFields } from '../enums/season-sort-fields.enum';
import { applyPagination } from 'src/common/utils/pagination.util';
import { PlotService } from '../plot/plot.service';
import { AddStepDto } from '../dtos/season/add-step.dto';
import { StepStatus } from '../enums/step-status.enum';
import { ProcessTrackingService } from 'src/modules/blockchain/process-tracking/process-tracking.service';
import { AddLogDto } from '../dtos/log/add-log.dto';
import { InactiveLogDto } from '../dtos/log/inactive-log.dto';
import { TrustworthinessService } from 'src/modules/blockchain/trustworthiness/trustworthiness.service';
import { TransparencyService } from 'src/modules/ftes/transparency/transparency.service';
import { TransparencyEmitEvent } from 'src/modules/ftes/enums/emit-event.enum';
import { StepType } from '../enums/step-type.enum';
import { ProductService } from 'src/modules/product/product/product.service';
import { FarmProductDetailDto } from 'src/modules/product/dtos/product/farm-product-detail.dto';
import { UpdateProductStatusDto } from 'src/modules/product/dtos/product/update-product-status.dto';
import { ProductStatus } from 'src/modules/product/enums/product-status.enum';

@Injectable()
export class SeasonService {

    private readonly logger = new Logger(SeasonService.name);

    constructor(
        @InjectRepository(Season) private readonly seasonRepository: Repository<Season>,
        private readonly dataSource: DataSource,
        private readonly plotService: PlotService,
        private readonly stepService: StepService,
        private readonly logService: LogService,
        private readonly processTrackingBlockchainservice: ProcessTrackingService,
        private readonly trustworthinessBlockchainService: TrustworthinessService,
        private readonly productService: ProductService,
        @Inject(forwardRef(() => TransparencyService)) private readonly transparencyService: TransparencyService
    ) { }

    async createSeason(farmId: number, createSeasonDto: CreateSeasonDto): Promise<SeasonDetailDto> {
        try {
            const season = this.seasonRepository.create({
                ...createSeasonDto,
                farm_id: farmId
            });

            // check start date
            const currentDate = new Date();
            if (season.start_date < currentDate) {
                throw new BadRequestException({
                    message: `Start date ${season.start_date} cannot be earlier than today ${currentDate}`,
                    code: ResponseCode.INPUT_DATE_EARLIER_THAN_CURRENT_DATE
                })
            }

            // check if previous season is done or not and previous season 
            // is short or long term, if previous season is short term and
            // a season is already exist, throw error
            const plot = await this.plotService.validateAddSeason(season.plot_id);

            season.image_url = createSeasonDto.image_url ?? plot.image_url;

            const result = await this.seasonRepository.save(season);
            return plainToInstance(SeasonDetailDto, result, { excludeExtraneousValues: true });
        }
        catch (error) {
            if (error instanceof HttpException) throw error;
            if (error instanceof QueryFailedError) {
                TriggerException.throwSeasonException(error);
            }
            this.logger.error(error.message);
            throw new InternalServerErrorException({
                message: error.message,
                code: ResponseCode.FAILED_TO_CREATE_SEASON,
            });
        }
    }

    async updateSeason(farmId: number, updateSeasonDto: UpdateSeasonDto): Promise<SeasonDetailDto> {
        try {
            const { name, notes, actual_yield } = updateSeasonDto;
            const season = await this.seasonRepository.findOneBy({ id: updateSeasonDto.id, farm_id: farmId });
            if (!season) throw new NotFoundException({
                message: "Season not found",
                code: ResponseCode.SEASON_NOT_FOUND
            });

            // handle start date earlier than current date
            const today = new Date();
            if (updateSeasonDto.start_date < today) {
                throw new BadRequestException({
                    message: `Start date (${updateSeasonDto.start_date}) cannot be earlier than today (${today.toISOString().split('T')[0]})`,
                    code: ResponseCode.FAILED_TO_UPDATE_SEASON,
                })
            }

            // if the seaon is already started, allow to update actual results
            if (season.status === SeasonStatus.DONE) {
                const result = await this.seasonRepository.save({ ...season, actual_yield });
                return plainToInstance(SeasonDetailDto, result, { excludeExtraneousValues: true });
            }

            // only allowing to update name & notes if the season is in progress 
            else if (season.status === SeasonStatus.IN_PROGRESS || season.start_date < new Date()) {
                const result = await this.seasonRepository.save({ ...season, name, notes });
                return plainToInstance(SeasonDetailDto, result, { excludeExtraneousValues: true });
            }

            // allowing update all fields exclude actual values
            else {
                const { actual_yield, ...res } = updateSeasonDto;
                const result = await this.seasonRepository.save({ ...season, ...res });
                return plainToInstance(SeasonDetailDto, result, { excludeExtraneousValues: true });
            }
        }
        catch (error) {
            if (error instanceof HttpException) throw error;
            this.logger.error(error.message);
            throw new InternalServerErrorException({
                message: "Failed to update season",
                code: ResponseCode.FAILED_TO_UPDATE_SEASON,
            });
        }
    }

    async getSeasons(farmId: number, getSeasonDto: GetSeasonDto): Promise<PaginationResult<SeasonDto>> {
        const paginationOptions = plainToInstance(PaginationTransform<SeasonSortFields>, getSeasonDto)
        const { season_status, search, plot_id, is_assigned } = getSeasonDto;
        const { sort_by, order } = paginationOptions;

        try {
            const qb = this.seasonRepository.createQueryBuilder("season")
                .select(seasonSelectFields)
                .where("season.farm_id = :farmId", { farmId });

            if (plot_id) {
                qb.andWhere("season.plot_id = :plotId", { plotId: plot_id });
            }

            if (search && search.trim() !== '') {
                qb.andWhere("season.name ILIKE :search", { search: `%${search}%` });
            }
            if (season_status) {
                qb.andWhere("season.status IN (:...status)", { status: season_status })
            }
            if (is_assigned != null && is_assigned != undefined) {
                qb.andWhere("season.is_assigned = :isAssigned", { isAssigned: is_assigned })
            }

            if (sort_by || order) {
                switch (sort_by) {
                    case SeasonSortFields.SEASON_NAME:
                        qb.orderBy("season.name", order);
                        break;
                    case SeasonSortFields.START_DATE:
                        qb.orderBy("season.start_date", order);
                        break;
                    case SeasonSortFields.UPDATED:
                        qb.orderBy("season.updated", order);
                    default:
                        qb.orderBy("season.id", order)
                }
            }

            const totalItems = await applyPagination(qb, paginationOptions);

            const seasons = await qb.getMany();
            const meta = new PaginationMeta({ paginationOptions, totalItems });
            return new PaginationResult(plainToInstance(
                SeasonDto,
                seasons,
                { excludeExtraneousValues: true }
            ), meta);
        }
        catch (error) {
            this.logger.error(error.message);
            throw new InternalServerErrorException({
                message: "Failed to get farm's season",
                code: ResponseCode.FAILED_TO_GET_SEASON
            });
        }
    }

    async getSeasonDetail(seasonId: number): Promise<SeasonDetailDto> {
        try {
            const queryBuilder = this.seasonRepository.createQueryBuilder("season")
                .select(seasonDetailSelectFields)
                .where("season.id = :seasonId", { seasonId });
            const season = await queryBuilder.getOne();
            if (!season) {
                throw new NotFoundException({
                    message: "season not found",
                    code: ResponseCode.SEASON_NOT_FOUND,
                })
            }
            return plainToInstance(SeasonDetailDto, season, { excludeExtraneousValues: true });
        }
        catch (error) {
            if (error instanceof HttpException) throw error;
            this.logger.error(error.message);
            throw new InternalServerErrorException({
                message: "Failed to get farm's season",
                code: ResponseCode.FAILED_TO_GET_SEASON
            });
        }
    }

    async addSeasonStep(addStepDto: AddStepDto): Promise<StepDto> {
        try {
            const season = await this.seasonRepository.createQueryBuilder("season")
                .select([
                    "season.start_date",
                    "season.id",
                    "plot.crop_id",
                ])
                .leftJoin("season.plot", "plot")
                .where("season.id = :seasonId", { seasonId: addStepDto.season_id })
                .getOne();

            if (!season) {
                throw new InternalServerErrorException();
            }

            if (season.status === SeasonStatus.DONE || season.status === SeasonStatus.CANCELED) {
                throw new BadRequestException({
                    message: `The season has not started yet. Season will be started after ${season.start_date}`,
                    code: ResponseCode.SEASON_IS_NOT_IN_PROGRESS,
                });
            }

            // validate date
            // if (season.start_date > new Date()) {
            //     throw new BadRequestException({
            //         message: `The season has not started yet. Season will be started after ${season.start_date}`,
            //         code: ResponseCode.SEASON_IS_NOT_STARTED,
            //     });
            // }

            await this.stepService.validateAddSeasonStep(season, addStepDto.step_id);

            return await this.dataSource.transaction(async (manager) => {
                const newStep = await this.stepService.addSeasonStep(addStepDto, manager);
                // update season status PENDING -> IN_PROGRESS
                if (season.status === SeasonStatus.PENDING) {
                    await this.updateSeasonStatus(addStepDto.season_id, SeasonStatus.IN_PROGRESS, manager);
                }
                return newStep;
            })
        } catch (error) {
            if (error instanceof HttpException) throw error;
            this.logger.error(error.message);
            throw new InternalServerErrorException({
                message: "Failed to add step",
                code: ResponseCode.FAILED_TO_ADD_STEP,
            })
        }
    }

    async getSeasonSteps(seasonId: number): Promise<StepDto[]> {
        return await this.stepService.getSeasonSteps(seasonId);
    }

    async verifySeasonStep(seasonId: number, stepId: number): Promise<boolean> {
        return await this.stepService.verifySeasonStep(seasonId, stepId);
    }

    async getLogs(seasonDetailId: number): Promise<Log[]> {
        return await this.logService.getLogs(seasonDetailId);
    }

    async getSeasonToAssign(seasonId: number): Promise<Season> {
        try {
            const season = await this.seasonRepository.findOne({
                where: { id: seasonId },
                select: ["id", "status"]
            });
            if (!season) throw new NotFoundException({
                message: "Season not found",
                code: ResponseCode.SEASON_NOT_FOUND
            })
            return season;
        }
        catch (error) {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException({
                message: "Failed to get season to assign",
                code: ResponseCode.FAILED_TO_GET_SEASON
            })
        }
    }

    async updateAssigned(seasonId: number, manager?: EntityManager): Promise<boolean> {
        const repo = manager ? manager.getRepository(Season) : this.seasonRepository;
        try {
            const result = await repo.update(
                { id: seasonId },
                { is_assigned: true },
            );
            if (result.affected === 0) {
                throw new Error();
            }
            return true;
        } catch (error) {
            if (error instanceof HttpException) throw error;
            this.logger.error(error.message);
            throw new InternalServerErrorException({
                message: "Failed to update season",
                code: ResponseCode.FAILED_TO_UPDATE_SEASON
            });
        }
    }

    async finishStep(seasonStepId: number): Promise<boolean> {
        try {
            const { active } = await this.logService.countActiveLogs(seasonStepId);
            const logCount = active;
            if (logCount <= 0) throw new BadRequestException({
                message: "Can not finish a step without any log",
                code: ResponseCode.NOT_ENOUGH_LOG
            });

            await this.dataSource.transaction(async (manager) => {
                // update season detail status IN_PROGRESS -> DONE
                if (await this.stepService.updateSeasonStepStatus(seasonStepId, StepStatus.DONE, manager)) {
                    const step = await this.stepService.getSeasonStep(seasonStepId);

                    // const transaction = await this.processTrackingBlockchainservice.addStep(step);
                    // await this.stepService.updateTransactionHash(
                    //     seasonStepId,
                    //     transaction.transactionHash,
                    //     manager
                    // );

                    // calc step transparency score
                    const stepTransparencyScore = await this.transparencyService.calcStepTransparencyScore(seasonStepId);
                    await this.stepService.updateTransparencyScore(seasonStepId, stepTransparencyScore, manager);

                    // if last step of the season, update season status IN_PROGRESS -> DONE to finish season
                    if (step.step_type === StepType.POST_HARVEST) {
                        // update status
                        await this.updateSeasonStatus(step.season_id, SeasonStatus.DONE, manager);

                        // calc season transparency score
                        const seasonTransparencyScore = await this.transparencyService.calcSeasonTransparencyScore(step.season_id);
                        await this.updateTransparencyScore(step.season_id, seasonTransparencyScore, manager);

                        // calc plot score
                        const plotId = await this.getSeasonPlotId(step.season_id);
                        const plotTransparencyScore = await this.transparencyService.calcPlotTransparencyScore(plotId);
                        await this.plotService.updateTransparencyScore(plotId, plotTransparencyScore, manager);
                    }
                }
            })

            return true;
        }
        catch (error) {
            if (error instanceof HttpException) throw error;
            this.logger.error(`Failed to finish step: ${error.message}`);
            throw new InternalServerErrorException({
                message: "Failed to finish step",
                code: ResponseCode.INTERNAL_ERROR
            })
        }
    }

    async addLog(farmId: number, addLogDto: AddLogDto): Promise<Log> {
        try {
            await this.stepService.validateAddLog(addLogDto);
            return await this.dataSource.transaction(async (manager) => {
                // save db
                const savedLog = await this.logService.addLog(farmId, addLogDto, manager);

                // update season detail status PENDING -> IN_PROGRESS
                await this.stepService.handleAfterAddLogs(addLogDto.season_detail_id, manager);

                // up blockchain
                const transaction = await this.processTrackingBlockchainservice.addLog(savedLog);

                // assess trust score
                await this.processData(savedLog, transaction.transactionHash ? true : false);

                // update transaction hash
                await this.logService.updateTransactionHash(savedLog.id, transaction.transactionHash, manager);

                savedLog.transaction_hash = transaction.transactionHash;
                savedLog.verified = transaction.transactionHash ? true : false;

                return savedLog;
            });
        }
        catch (error) {
            if (error instanceof HttpException) throw error;
            this.logger.error("Failed to add log: ", error.message);
            throw new InternalServerErrorException({
                message: "Failed to add log",
                code: ResponseCode.FAILED_TO_ADD_LOG
            })
        }
    }

    async unactiveLog(dto: InactiveLogDto): Promise<boolean> {
        try {
            const result = this.dataSource.transaction(async (manager) => {
                const result = await this.logService.unactiveLog(dto, manager);
                await this.stepService.updateInactiveLogNum(dto.season_step_id, manager);
                return result;
            });
            return result;
        }
        catch (error) {
            if (error instanceof BadRequestException) throw error;
            this.logger.error(`Failed to inactive log: ${error.message}`);
            throw new InternalServerErrorException({
                message: "Failed to inactive log",
                code: ResponseCode.INTERNAL_ERROR
            })
        }
    }

    private async processData(log: Log, verified: boolean): Promise<void> {
        const plotLocation = await this.stepService.getPlotLocation(log.season_detail_id);

        await this.trustworthinessBlockchainService.processData(log.id, "log", "default", {
            verified: verified,
            logLocation: {
                latitude: log.location.lat * 1000000,
                longitude: log.location.lng * 1000000
            },
            plotLocation: {
                latitude: plotLocation.lat * 1000000,
                longitude: plotLocation.lng * 1000000,
            },
            imageCount: log.image_urls.length,
            videoCount: log.video_urls.length,
        });
    }

    private async updateSeasonStatus(seasonId: number, seasonStatus: SeasonStatus, manager?: EntityManager): Promise<void> {
        const repo = manager ? manager.getRepository(Season) : this.seasonRepository;
        try {
            const season = await repo.findOne({
                select: ["status"],
                where: { id: seasonId }
            })
            if (!season) throw Error();
            const currentStatus = season.status;

            switch (seasonStatus) {
                case SeasonStatus.CANCELED:
                    await repo.update({ id: seasonId }, { status: SeasonStatus.CANCELED });
                    return;
                case SeasonStatus.IN_PROGRESS:
                    if (currentStatus === SeasonStatus.PENDING) {
                        await repo.update({ id: seasonId }, { status: SeasonStatus.IN_PROGRESS });
                        return;
                    }
                case SeasonStatus.DONE:
                    if (currentStatus === SeasonStatus.IN_PROGRESS) {
                        await repo.update({ id: seasonId }, { status: SeasonStatus.DONE, actual_end_date: new Date() });
                        return;
                    }
            }
            throw new BadRequestException({
                message: "Invalid season status",
                code: ResponseCode.INVALID_STATUS
            })
        }
        catch (error) {
            this.logger.error(`Failed to update season: ${error.message}`);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException({
                message: "Failed to update season",
                code: ResponseCode.INTERNAL_ERROR
            })
        }
    }

    private async updateTransparencyScore(seasonId: number, score: number, manager?: EntityManager): Promise<void> {
        try {
            const repo = manager ? manager.getRepository(Season) : this.seasonRepository;
            await repo.update(
                { id: seasonId },
                { transparency_score: score })
        }
        catch (error) {
            this.logger.error(`Failed to update season transparency score: ${error.message}`);
            throw new InternalServerErrorException({
                message: "Failed to update season transparency score",
                code: ResponseCode.FAILED_TO_UPDATE_SEASON
            })
        }
    }

    async getSeasonsScores(plotId: number): Promise<{ id: number, score: number, endDate?: Date }[]> {
        try {
            const seasons = await this.seasonRepository.find({
                select: ["id", "transparency_score", "actual_end_date"],
                where: { plot_id: plotId }
            });
            return seasons.map((s) => ({ id: s.id, score: s.transparency_score ?? 0, endDate: s.actual_end_date }))
        }
        catch (error) {
            this.logger.error(`Failed to get season transparency scores: ${error.message}`);
            throw new InternalServerErrorException({
                message: "Failed to get season transparency scores",
                code: ResponseCode.INTERNAL_ERROR
            })
        }
    }

    async getFarmAllAssignedSeasonsScores(farmId: number): Promise<{ id: number, score: number, endDate?: Date }[]> {
        try {
            const seasons = await this.seasonRepository.find({
                select: ["id", "transparency_score", "actual_end_date"],
                where: { farm_id: farmId, is_assigned: true }
            });
            return seasons.map((s) => ({ id: s.id, score: s.transparency_score ?? 0, endDate: s.actual_end_date }))
        }
        catch (error) {
            this.logger.error(`Failed to get season transparency scores: ${error.message}`);
            throw new InternalServerErrorException({
                message: "Failed to get season transparency scores",
                code: ResponseCode.INTERNAL_ERROR
            })
        }
    }

    async assignSeason(productId: number, seasonId: number): Promise<FarmProductDetailDto> {
        try {
            const product = await this.productService.findOneById(productId);
            const season = await this.getSeasonToAssign(seasonId);
            if (season.status != SeasonStatus.DONE) throw new BadRequestException({
                message: "Season is not completed",
                code: ResponseCode.SEASON_IS_NOT_COMPLETED_TO_ASSIGN
            })
            product.season_id = season.id;
            const result = await this.dataSource.transaction(async (manager) => {
                const result = await manager.save(product);
                await this.updateAssigned(season.id, manager);
                return result;
            });
            return plainToInstance(FarmProductDetailDto, result, { excludeExtraneousValues: true });
        } catch (error) {
            if (error instanceof HttpException) throw error;
            this.logger.error(error.message);
            throw new InternalServerErrorException({
                message: `Failed to assign season`,
                code: ResponseCode.FAILED_TO_ASSIGN_SEASON,
            });
        }
    }

    async updateProductStatus(productId: number, dto: UpdateProductStatusDto): Promise<boolean> {
        try {
            const newStatus = dto.status;
            const validStatus = [
                ProductStatus.OPEN_FOR_SALE,
                ProductStatus.CLOSED,
            ];
            if (!validStatus.includes(newStatus))
                throw new BadRequestException({
                    message: "Invalid status",
                    code: ResponseCode.INVALID_STATUS,
                });

            const product = await this.productService.getProductSeasonStatus(productId);
            if (!product.season_id) {
                throw new BadRequestException({
                    message: "Invalid product",
                    code: ResponseCode.INVALID_PRODUCT_TO_UPDATE_STATUS
                })
            }
            if (newStatus === ProductStatus.OPEN_FOR_SALE) {
                const season = await this.getSeasonToAssign(product.season_id);
                if (!season || season.status !== SeasonStatus.DONE) {
                    throw new BadRequestException({
                        message: "Invalid product",
                        code: ResponseCode.SEASON_IS_NOT_COMPLETED_TO_ASSIGN
                    })
                }
            }

            await this.productService.updateProductStatus(productId, dto.status);
            return true;
        } catch (error) {
            if (error instanceof HttpException) throw error;
            this.logger.error(error.message);
            throw new InternalServerErrorException({
                message: "Failed to update product status",
                code: ResponseCode.FAILED_TO_UPDATE_PRODUCT
            });
        }
    }

    private async getSeasonPlotId(seasonId: number): Promise<number> {
        const season = await this.seasonRepository.findOne({
            select: ["id", "plot_id"],
            where: { id: seasonId }
        })
        if (!season) throw new Error(`Season ${seasonId} not found`);
        return season.plot_id;
    }

    // todo!("handle cron job to update status every day")
    // @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    // async startSeason() {
    //     try {
    //         const result = await this.seasonRepository.createQueryBuilder()
    //             .update(Season)
    //             .set({ status: SeasonStatus.IN_PROGRESS })
    //             .where('start_date::date = CURRENT_DATE')
    //             .execute();
    //     }
    //     catch (error) {
    //         this.logger.error(error);
    //     }
    // }
}
