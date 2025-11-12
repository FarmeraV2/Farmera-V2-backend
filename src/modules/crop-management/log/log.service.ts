import { HttpException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Log } from '../entities/log.entity';
import { GetStepDto } from '../dtos/step/get-step.dto';
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

@Injectable()
export class LogService {

    private readonly logger = new Logger(LogService.name);

    constructor(
        @InjectRepository(Log) private readonly logRepository: Repository<Log>,
    ) { }

    async addLog(seasonId: number, stepId: number, farmId: number, addLogDto: AddLogDto): Promise<Log> {
        try {
            const newLog = this.logRepository.create({
                ...addLogDto,
                farm_id: farmId,
                season_id: seasonId,
                step_id: stepId,
            })
            const result = await this.logRepository.save(newLog);

            // todo!("upload to blockchain")

            return result;
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

    async getLogs(seasonId: number, stepId: number): Promise<Log[]> {
        try {
            return await this.logRepository.find({
                where: {
                    season_id: seasonId,
                    step_id: stepId,
                }
            })
        }
        catch (error) {
            this.logger.error("Failed to get logs: ", error.message);
            throw new InternalServerErrorException({
                message: "Failed to add log",
                code: ResponseCode.FAILED_TO_GET_LOGS
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
                code: ResponseCode.FAILED_TO_GET_LOGS
            })
        }
    }
}
