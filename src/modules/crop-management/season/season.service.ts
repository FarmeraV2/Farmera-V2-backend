import { BadRequestException, HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Season } from '../entities/season.entity';
import { CreateSeasonDto } from '../dtos/season/create-season.dto';
import { SeasonStatus } from '../enums/season-status.enum';
import { UpdateSeasonDto } from '../dtos/season/update-season.dto';
import { PaginationOptions, PaginationTransform } from 'src/common/dtos/pagination/pagination-option.dto';
import { PaginationResult } from 'src/common/dtos/pagination/pagination-result.dto';
import { PaginationMeta } from 'src/common/dtos/pagination/pagination-meta.dto';
import { ResponseCode } from 'src/common/constants/response-code.const';
import { SeasonDetailDto, seasonDetailSelectFields, SeasonDto, seasonSelectFields } from '../dtos/season/season.dto';
import { TriggerException } from 'src/database/utils/trigger.exception';
import { StepService } from '../step/step.service';
import { addStepDto } from '../dtos/season/add-step.dto';
import { StepDto } from '../dtos/step/step.dto';
import { GetStepDto } from '../dtos/step/get-step.dto';
import { LogService } from '../log/log.service';
import { Log } from '../entities/log.entity';
import { AddLogDto } from '../dtos/log/add-log.dto';
import { GetSeasonDto } from '../dtos/season/get-season.dto';
import { plainToInstance } from 'class-transformer';
import { SeasonSortFields } from '../enums/season-sort-fields.enum';
import { applyPagination } from 'src/common/utils/pagination.util';
import { PlotService } from '../plot/plot.service';

@Injectable()
export class SeasonService {

    private readonly logger = new Logger(SeasonService.name);

    constructor(
        @InjectRepository(Season) private readonly seasonRepository: Repository<Season>,
        private readonly plotService: PlotService,
        private readonly stepService: StepService,
        private readonly logService: LogService,
    ) { }

    async createSeason(farmId: number, createSeasonDto: CreateSeasonDto): Promise<SeasonDetailDto> {
        try {
            const season = this.seasonRepository.create({ ...createSeasonDto, farm_id: farmId });

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

    async updateSeason(farmId: number, seasonId: number, updateSeasonDto: UpdateSeasonDto): Promise<Season> {
        try {
            const { name, notes } = updateSeasonDto;
            const season = await this.seasonRepository.findOneBy({ id: seasonId, farm_id: farmId });
            if (!season) throw new NotFoundException("Season not found");

            // handle start date earlier than current date
            const today = new Date();
            if (updateSeasonDto.start_date < today) {
                throw new BadRequestException({
                    message: `Start date (${updateSeasonDto.start_date}) cannot be earlier than today (${today.toISOString().split('T')[0]})`,
                    code: ResponseCode.FAILED_TO_UPDATE_SEASON,
                })
            }

            // if the seaon is already started
            if (season.status === SeasonStatus.DONE) {
                throw new BadRequestException({
                    message: "Cannot update a finished season",
                    code: ResponseCode.FAILED_TO_UPDATE_SEASON,
                })
            }

            // only allowing to update name & notes if the season is in progress 
            else if (season.status === SeasonStatus.IN_PROGRESS || season.start_date < new Date()) {
                return await this.seasonRepository.save({ ...season, name, notes });
            }

            // allowing update all fields
            else {
                return await this.seasonRepository.save({ ...season, ...updateSeasonDto });
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
        const { season_status, search, plot_id } = getSeasonDto;
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
            const season = await this.seasonRepository.findOne({
                where: { id: seasonId },
            });
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
            throw new InternalServerErrorException("Failed to get farm's season");
        }
    }

    async addStep(seasonId: number, addStepDto: addStepDto): Promise<StepDto> {
        return await this.stepService.addStep(seasonId, addStepDto);
    }

    async getSteps(seasonId: number, getStepDto: GetStepDto): Promise<PaginationResult<StepDto>> {
        return await this.stepService.getSteps(seasonId, getStepDto);
    }

    async verifyStep(seasonId: number, stepId: number): Promise<boolean> {
        return await this.stepService.verifyStep(seasonId, stepId);
    }

    async getLogs(seasonId: number, stepId: number): Promise<Log[]> {
        return await this.logService.getLogs(seasonId, stepId);
    }

    async addLog(seasonId: number, stepId: number, farmId: number, addLogDto: AddLogDto): Promise<Log> {
        return await this.logService.addLog(seasonId, stepId, farmId, addLogDto);
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
