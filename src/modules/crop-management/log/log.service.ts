import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
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
import { BlockchainService } from 'src/services/blockchain.service';
import { HashedLog } from '../dtos/log/hashed-log.dto';
import { LogType } from '../enums/log-type.enum';
import { StepService } from '../step/step.service';
import { SeasonDetail } from '../entities/season-detail.entity';

@Injectable()
export class LogService {

    private readonly logger = new Logger(LogService.name);

    constructor(
        @InjectRepository(Log) private readonly logRepository: Repository<Log>,
        private readonly dataSource: DataSource,
        private readonly blockchainService: BlockchainService,
        private readonly stepService: StepService,
    ) { }

    async addLog(seasonId: number, stepId: number, farmId: number, addLogDto: AddLogDto): Promise<Log> {
        try {
            let savedLog: Log | undefined;

            await this.dataSource.transaction(async (transactionalEntityManager) => {
                const newLog = this.logRepository.create({
                    ...addLogDto,
                    farm_id: farmId,
                    season_id: seasonId,
                    step_id: stepId,
                });

                savedLog = await transactionalEntityManager.save(newLog);

                const trasaction = await this.blockchainService.addLog(savedLog);

                await transactionalEntityManager.update(
                    Log,
                    { id: savedLog.id },
                    { transaction_hash: trasaction.transactionHash })

                savedLog.transaction_hash = trasaction.transactionHash;
                savedLog.verified = trasaction.transactionHash ? true : false;
            });

            if (!savedLog) {
                throw new InternalServerErrorException();
            }

            // upload step to blockchain if this is the last step
            if (savedLog.type === LogType.DONE) {
                const step = await this.stepService.getStep(seasonId, stepId);
                const transaction = await this.blockchainService.addStep(step);
                await this.stepService.updateTransactionHash(step.season_id, step.step_id, transaction.transactionHash);
            }

            return savedLog;
        }
        catch (error) {
            if (error instanceof QueryFailedError) {
                TriggerException.throwLogException(error);
            }
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

    async getLogs(seasonId: number, stepId: number): Promise<Log[]> {
        try {
            const logs = await this.logRepository.find({
                where: {
                    season_id: seasonId,
                    step_id: stepId,
                }
            });
            const hashedLogs = await this.blockchainService.getHashedLogs(seasonId, stepId);

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
}
