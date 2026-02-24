import { BadRequestException, HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Log } from '../entities/log.entity';
import { AddLogDto } from '../dtos/log/add-log.dto';
import { ResponseCode } from 'src/common/constants/response-code.const';
import { ListLogDto } from '../dtos/log/list-log.dto';
import { PaginationResult } from 'src/common/dtos/pagination/pagination-result.dto';
import { plainToInstance } from 'class-transformer';
import { PaginationTransform } from 'src/common/dtos/pagination/pagination-option.dto';
import { LogDto } from '../dtos/log/log.dto';
import { applyPagination } from 'src/common/utils/pagination.util';
import { PaginationMeta } from 'src/common/dtos/pagination/pagination-meta.dto';
import { HashedLog } from '../dtos/log/hashed-log.dto';
import { InactiveLogDto } from '../dtos/log/inactive-log.dto';
import { ProcessTrackingService } from 'src/modules/blockchain/process-tracking/process-tracking.service';

@Injectable()
export class LogService {

    private readonly logger = new Logger(LogService.name);

    constructor(
        @InjectRepository(Log) private readonly logRepository: Repository<Log>,
        private readonly dataSource: DataSource,
        private readonly processTrackingBlockchainservice: ProcessTrackingService,
    ) { }

    async addLog(farmId: number, addLogDto: AddLogDto, manager?: EntityManager): Promise<Log> {
        const repo = manager ? manager.getRepository(Log) : this.logRepository;
        try {
            const newLog = this.logRepository.create({
                ...addLogDto,
                farm_id: farmId,
            });

            return await repo.save(newLog);
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

    async updateTransactionHash(id: number, transactionHash: string, manager?: EntityManager): Promise<string> {
        const repo = manager ? manager.getRepository(Log) : this.logRepository;
        const result = await repo.update(
            { id: id },
            { transaction_hash: transactionHash }
        );
        if (result.affected && result.affected > 0) return transactionHash;
        throw Error("Failed to update transaction hash");
    }

    async getLog(logId: number): Promise<Log | null> {
        try {
            return await this.logRepository.findOne({
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

    async save(log: Log): Promise<Log> {
        try {
            return await this.logRepository.save(log);
        }
        catch (error) {
            this.logger.error("Failed to save log: ", error.message);
            throw new InternalServerErrorException({
                message: "Failed to save log",
                code: ResponseCode.INTERNAL_ERROR
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
                hashedLogs = await this.processTrackingBlockchainservice.getHashedLogs(seasonDetailId);
            } catch (error) {
                this.logger.error("Failed to hashed logs: ", error.message);
            }

            hashedLogs.map((data) => {
                const log = logs.find((log) => log.id === data.id);
                if (log) {
                    log.verified = this.processTrackingBlockchainservice.hashData(HashedLog, log) === data.hash;
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

    async unactiveLog(dto: InactiveLogDto, manager?: EntityManager): Promise<boolean> {
        const repo = manager ? manager.getRepository(Log) : this.logRepository;
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
            const result = await repo.update({ id: dto.log_id }, { is_active: false });

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

    async countActiveLogs(seasonDetailId: number): Promise<{ active: number, unactive: number }> {
        try {
            const result = await this.dataSource.query(`
                SELECT 
                    COUNT(*) FILTER(WHERE is_active = true) AS "active",
                    COUNT(*) FILTER(WHERE is_active = false) AS "unactive"
                FROM "log"
                WHERE season_detail_id = $1
                `, [seasonDetailId]);

            return {
                active: result[0].active ? parseInt(result[0].active) : 0,
                unactive: result[0].unactive ? parseInt(result[0].unactive) : 0,
            }
        } catch (error) {
            throw new InternalServerErrorException({
                message: "Failed to count active logs",
                code: ResponseCode.INTERNAL_ERROR
            });
        }
    }

    async getActiveLogIds(seasonDetailId: number): Promise<number[]> {
        try {
            const logs = await this.logRepository.find({
                select: ["id"],
                where: {
                    season_detail_id: seasonDetailId,
                    is_active: true,
                }
            });
            return logs.map(log => log.id);
        } catch (error) {
            throw new InternalServerErrorException({
                message: "Failed to get active log ids",
                code: ResponseCode.INTERNAL_ERROR
            });
        }
    }

    // async updateVerifyImage(logId: number, value: boolean, manager?: EntityManager): Promise<boolean> {
    //     const repo = manager ? manager.getRepository(Log) : this.logRepository;
    //     try {
    //         const result = await repo.update({ id: logId }, { image_verified: value });

    //         if (result.affected && result.affected > 0) return true;
    //         throw new InternalServerErrorException();
    //     }
    //     catch (error) {
    //         if (error instanceof BadRequestException) throw error;
    //         this.logger.error(`Failed to inactive log: ${error.message}`);
    //         throw new InternalServerErrorException({
    //             message: "Failed to inactive log",
    //             code: ResponseCode.INTERNAL_ERROR
    //         })
    //     }
    // }

    async getLogById(logId: number): Promise<Log> {
        const log = await this.logRepository.findOne({ where: { id: logId } });
        if (!log) throw new Error();
        return log;
    }
}
