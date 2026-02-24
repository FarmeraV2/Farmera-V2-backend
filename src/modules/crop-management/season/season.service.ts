import { BadRequestException, HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
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
import { AddLogDto } from '../dtos/log/add-log.dto';
import { InactiveLogDto } from '../dtos/log/inactive-log.dto';
import { ProductService } from 'src/modules/product/product/product.service';
import { FarmProductDetailDto } from 'src/modules/product/dtos/product/farm-product-detail.dto';
import { UpdateProductStatusDto } from 'src/modules/product/dtos/product/update-product-status.dto';
import { ProductStatus } from 'src/modules/product/enums/product-status.enum';
import { LogAddedEvent } from 'src/common/events/log-added.event';
import { LogUploadedEvent } from 'src/common/events/log-uploaded.event';
import { LogVerified } from 'src/common/events/log-verified.event';
import { OnChainLogStatus } from '../enums/onchain-log-status.enum';
import { ProcessTrackingService } from 'src/modules/blockchain/process-tracking/process-tracking.service';
import { LogSkipReviewEvent } from 'src/common/events/log-skip-review.event';
import { TrustComputationService } from 'src/modules/blockchain/trustworthiness/trust-computation.service';
import { TrustedLogAuditor, TrustedLogDefault } from 'src/modules/blockchain/interfaces/trusted-log.interface';
import { TrustProcessedEvent } from 'src/modules/blockchain/interfaces/trust-computation-event.interface';
import Web3 from 'web3';
import { StepStatus } from '../enums/step-status.enum';
import { StepType } from '../enums/step-type.enum';
import { VerificationIdentifier } from '../enums/verification-identifier.enum';

@Injectable()
export class SeasonService {

    private readonly logger = new Logger(SeasonService.name);

    constructor(
        @InjectRepository(Season) private readonly seasonRepository: Repository<Season>,
        private readonly dataSource: DataSource,
        private readonly plotService: PlotService,
        private readonly stepService: StepService,
        private readonly logService: LogService,

        private readonly productService: ProductService,
        private readonly processTrackingService: ProcessTrackingService,
        private readonly trustComputionService: TrustComputationService,
        private readonly emitter: EventEmitter2,
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
                    "season.status",
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

            // // validate date
            // const newDate = new Date().getTime();
            // if (season.start_date.getTime() > newDate) {
            //     console.log(season.start_date.getTime());
            //     console.log(newDate);
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
            // const hasPending = await this.logService.hasPendingLogs(seasonStepId);

            if (await this.stepService.updateSeasonStepStatus(seasonStepId, StepStatus.DONE)) {
                // update season detail status IN_PROGRESS -> DONE
                const step = await this.stepService.getSeasonStep(seasonStepId);

                // if last step of the season, update season status IN_PROGRESS -> DONE to finish season
                if (step.step_type === StepType.POST_HARVEST) {
                    // update status
                    await this.updateSeasonStatus(step.season_id, SeasonStatus.DONE);


                }

                setTimeout(() => {
                    void (async () => {
                        try {
                            const transaction = await this.processTrackingService.addStep(step);
                            await this.stepService.updateTransactionHash(
                                seasonStepId,
                                transaction.transactionHash,
                            );
                        } catch (error) {
                            this.logger.error(`Failed to upload step ${seasonStepId} to blockchain`);
                        }
                    })();
                }, 0);
            }

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
            // save db
            const savedLog = await this.logService.addLog(farmId, addLogDto);

            // update season detail status PENDING -> IN_PROGRESS
            await this.stepService.handleAfterAddLogs(addLogDto.season_detail_id);

            // Evaluate for verification
            this.emitter.emit(LogAddedEvent.name, new LogAddedEvent(savedLog, farmId));

            return savedLog;
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

    /**
     * Returns on-chain trust scores for all audited logs of a farm.
     *
     * Used by the farm-level Geometric Mean score (T_farm).
     * Inclusion criterion: trust_score IS NOT NULL (log was processed by on-chain contract).
     * is_active is intentionally NOT used — a log audited on-chain is immutable evidence
     * regardless of whether the farmer later deactivates it. This prevents score inflation
     * by hiding rejected logs via soft-delete.
     *
     * @param farmId  The farm's internal ID
     * @returns       Array of trust_score values [0–100] for all on-chain audited logs
     */
    async getFarmLogScores(farmId: number): Promise<number[]> {
        try {
            const logIds = await this.logService.getLogIds(farmId);
            const record = await this.trustComputionService.getTrustRecords(VerificationIdentifier.LOG, logIds);
            return record.map((r) => r.trustScore);
        } catch (error) {
            this.logger.error(`Failed to get farm log trust scores: ${error.message}`);
            throw new InternalServerErrorException({
                message: 'Failed to get farm log trust scores',
                code: ResponseCode.INTERNAL_ERROR,
            });
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

    @OnEvent(LogUploadedEvent.name)
    async updateLogTransactionHash(payload: LogUploadedEvent): Promise<void> {
        await this.logService.updateTransactionHash(payload.id, payload.transactionHash);
    }

    @OnEvent(LogVerified.name)
    async handleLogVerified(payload: LogVerified): Promise<void> {
        try {
            const { id, consensus } = payload;
            const log = await this.logService.getLog(id);
            if (!log) throw new Error();

            log.status = consensus ? OnChainLogStatus.Verified : OnChainLogStatus.Rejected;

            const plotLocation = await this.stepService.getPlotLocation(log.season_detail_id);

            const result = await this.trustComputionService.processData<TrustedLogAuditor>(VerificationIdentifier.LOG, log.id, "log", "auditor", {
                identifier: Web3.utils.keccak256(VerificationIdentifier.LOG),
                id: log.id,
                imageCount: log.image_urls.length,
                videoCount: log.video_urls.length,
                logLocation: {
                    latitude: log.location.lat * 1000000,
                    longitude: log.location.lng * 1000000
                },
                plotLocation: {
                    latitude: plotLocation.lat * 1000000,
                    longitude: plotLocation.lng * 1000000,
                },
            }, {
                abiType: "tuple(bytes32,uint64,uint128,uint128,(int128,int128),(int128,int128))",
                map: (data) => [
                    data.identifier,
                    data.id,
                    data.imageCount,
                    data.videoCount,
                    [
                        Math.round(data.logLocation.latitude),
                        Math.round(data.logLocation.longitude),
                    ],
                    [
                        Math.round(data.plotLocation.latitude),
                        Math.round(data.plotLocation.longitude),
                    ],
                ],
            });

            const event = result.events?.TrustProcessed.returnValues!;
            await this.handleTrustProcessedEventForLog(log, event);
        }
        catch (error) {
            this.logger.error("Failed to handle verified event for auditor processed log from trust computation contract");
        }
    }

    @OnEvent(LogSkipReviewEvent.name)
    async handleSkippedLog(payload: LogSkipReviewEvent): Promise<void> {
        try {
            const log = payload.log;
            const plotLocation = await this.stepService.getPlotLocation(log.season_detail_id);

            const result = await this.trustComputionService.processData<TrustedLogDefault>(VerificationIdentifier.LOG, log.id, "log", "default", {
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
            }, {
                abiType: "tuple(uint128,uint128,(int128,int128),(int128,int128))",
                map: (data) => [
                    data.imageCount,
                    data.videoCount,
                    [
                        Math.round(data.logLocation.latitude),
                        Math.round(data.logLocation.longitude),
                    ],
                    [
                        Math.round(data.plotLocation.latitude),
                        Math.round(data.plotLocation.longitude),
                    ],
                ],
            });

            const event = result.events?.TrustProcessed.returnValues!;

            await this.handleTrustProcessedEventForLog(log, event);
        }
        catch (error) {
            this.logger.error("Failed to handle verified event for skipped log from trust computation contract");
        }
    }

    private async handleTrustProcessedEventForLog(log: Log, event: Record<string, any>) {
        const res: TrustProcessedEvent = {
            identifier: event.identifier,
            id: Number(event.id),
            accept: event.accept,
            trustScore: event.trustScore,
        }

        log.status = res.accept ? OnChainLogStatus.Verified : OnChainLogStatus.Rejected;
        const savedLog = await this.logService.save(log);
        const transaction = await this.processTrackingService.addLog(savedLog);
        await this.logService.updateTransactionHash(log.id, transaction.transactionHash);

        // Tier 2 → Tier 1 mapping: step score = log trust score
        // trustScore is uint128 [0–100] from on-chain (SCALE=100); normalize to [0,1] for DB
        const stepScore = Number(res.trustScore) / 100;
        await this.stepService.updateTransparencyScore(log.season_detail_id, stepScore);
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
