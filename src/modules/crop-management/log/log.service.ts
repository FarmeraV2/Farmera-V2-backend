import { BadRequestException, HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { Log } from '../entities/log.entity';
import { AddLogDto } from '../dtos/log/add-log.dto';
import { ResponseCode } from 'src/common/constants/response-code.const';
import { TriggerException } from 'src/database/utils/trigger.exception';
import { ListLogDto } from '../dtos/log/list-log.dto';
import { PaginationResult } from 'src/common/dtos/pagination/pagination-result.dto';
import { plainToInstance } from 'class-transformer';
import { PaginationTransform } from 'src/common/dtos/pagination/pagination-option.dto';
import { LogDto } from '../dtos/log/log.dto';
import { applyPagination } from 'src/common/utils/pagination.util';
import { PaginationMeta } from 'src/common/dtos/pagination/pagination-meta.dto';
import { HashedLog } from '../dtos/log/hashed-log.dto';
import { StepService } from '../step/step.service';
import { StepStatus } from '../enums/step-status.enum';
import { InactiveLogDto } from '../dtos/log/inactive-log.dto';
import { ProcessTrackingService } from 'src/modules/blockchain/process-tracking/process-tracking.service';

@Injectable()
export class LogService {

    private readonly logger = new Logger(LogService.name);

    constructor(
        @InjectRepository(Log) private readonly logRepository: Repository<Log>,
        private readonly dataSource: DataSource,
        private readonly blockchainService: ProcessTrackingService,
        private readonly stepService: StepService,
    ) { }

    async addLog(farmId: number, addLogDto: AddLogDto): Promise<Log> {
        try {
            let savedLog: Log | undefined;

            await this.validateAddLog(addLogDto);

            await this.dataSource.transaction(async (transactionalEntityManager) => {
                const newLog = this.logRepository.create({
                    ...addLogDto,
                    farm_id: farmId,
                });

                savedLog = await transactionalEntityManager.save(newLog);

                const transaction = await this.blockchainService.addLog(savedLog);

                await transactionalEntityManager.update(
                    Log,
                    { id: savedLog.id },
                    { transaction_hash: transaction.transactionHash })

                savedLog.transaction_hash = transaction.transactionHash;
                savedLog.verified = transaction.transactionHash ? true : false;
            });

            if (!savedLog) {
                throw new InternalServerErrorException();
            }

            return savedLog;
        }
        catch (error) {
            if (error instanceof QueryFailedError) {
                TriggerException.throwLogException(error);
            }
            if (error instanceof HttpException) throw error;
            this.logger.error("Failed to add log: ", error.message);
            throw new InternalServerErrorException({
                message: "Failed to add log",
                code: ResponseCode.FAILED_TO_ADD_LOG
            })
        }
    }

    async getLog(logId: number) {
        try {
            return await this.logRepository.find({
                where: { id: logId }
            })
        }
        catch (error) {
            this.logger.error("Failed to get log: ", error.message);
            throw new InternalServerErrorException({
                message: "Failed to add log",
                code: ResponseCode.FAILED_TO_GET_LOG
            })
        }
    }

    async getLogs(seasonDetailId: number): Promise<Log[]> {
        try {
            const logs = await this.logRepository.find({
                where: { season_detail_id: seasonDetailId, },
                order: { id: "DESC" }
            });
            if (logs.length === 0) {
                return logs;
            }
            let hashedLogs: { id: number, hash: string }[] = [];
            try {
                hashedLogs = await this.blockchainService.getHashedLogs(seasonDetailId);
            } catch (error) {
                this.logger.error("Failed to hashed logs: ", error.message);
            }

            hashedLogs.map((data) => {
                const log = logs.find((log) => log.id === data.id);
                if (log) {
                    log.verified = this.blockchainService.hashData(HashedLog, log) === data.hash;
                }
            })

            return logs;
        }
        catch (error) {
            this.logger.error("Failed to get logs: ", error.message);
            throw new InternalServerErrorException({
                message: "Failed to add log",
                code: ResponseCode.FAILED_TO_GET_LOG
            })
        }
    }

    async listLogs(listLogDto: ListLogDto): Promise<PaginationResult<LogDto>> {
        const paginationOptions = plainToInstance(PaginationTransform<string>, listLogDto);
        try {
            const queryBuilder = this.logRepository.createQueryBuilder("log")
                .leftJoin("log.farm", "farm")
                .addSelect(["farm.farm_name"]);
            if (listLogDto.farm_id) {
                const farmId = listLogDto.farm_id;
                queryBuilder.where("farm_id = :farmId", { farmId });
            }
            if (listLogDto.farm_search) {
                const search = "%" + listLogDto.farm_search + "%";
                queryBuilder.where("farm_name ILIKE :search", { search })
            }
            const totalItems = await applyPagination(queryBuilder, paginationOptions);

            const result = await queryBuilder.getMany();
            const logs = plainToInstance(
                LogDto,
                result.map((res): LogDto => ({
                    ...res,
                    farm_name: res.farm?.farm_name
                })),
                { excludeExtraneousValues: true }
            )
            return new PaginationResult(logs, new PaginationMeta({ paginationOptions, totalItems }))

        }
        catch (error) {
            this.logger.error("Failed to get logs: ", error.message);
            throw new InternalServerErrorException({
                message: "Failed to add log",
                code: ResponseCode.FAILED_TO_GET_LOG
            })
        }
    }

    async finishStep(seasonStepId: number): Promise<boolean> {
        try {
            const logCount = await this.logRepository.count({
                where: {
                    season_detail_id: seasonStepId,
                    is_active: true,
                }
            });
            if (logCount <= 0) throw new BadRequestException({
                message: "Can not finish a step without any log",
                code: ResponseCode.NOT_ENOUGH_LOG
            });

            if (await this.stepService.updateSeasonStepStatus(seasonStepId, StepStatus.DONE)) {
                const step = await this.stepService.getSeasonStep(seasonStepId);
                const transaction = await this.blockchainService.addStep(step);
                await this.stepService.updateTransactionHash(
                    step.season_id,
                    step.step_id,
                    transaction.transactionHash,
                );
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

    async unactiveLog(dto: InactiveLogDto): Promise<boolean> {
        try {
            // const latestLog = await this.logRepository.findOne({
            //     select: ["id"],
            //     where: { season_detail_id: dto.season_step_id },
            //     order: { id: "DESC" }
            // })
            // if (!latestLog) throw new NotFoundException({
            //     message: "Log not found",
            //     code: ResponseCode.LOG_NOT_FOUND
            // })
            // if (latestLog.id !== dto.log_id) throw new BadRequestException({
            //     message: "Invalid to to inactive",
            //     code: ResponseCode.INVALID_LOG_TO_INACTIVE
            // })
            const result = await this.dataSource.transaction(async (manager) => {
                const result = await manager.update(Log, { id: dto.log_id }, { is_active: false });
                await this.stepService.updateInactiveLogNum(dto.season_step_id, manager);
                return result;
            });

            if (result.affected && result.affected > 0) return true;
            throw new InternalServerErrorException();
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

    private async validateAddLog(newLog: AddLogDto): Promise<void> {
        const sd = await this.stepService.getSeasonDetailForValidateAddLog(newLog.season_detail_id);

        if (sd.step_status === StepStatus.DONE) {
            throw new BadRequestException({
                message: 'Cannot add logs to a step that is already DONE.',
                code: ResponseCode.STEP_ALREADY_DONE
            });
        }
    }
}
