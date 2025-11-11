import { BadRequestException, HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Season } from '../entities/season.entity';
import { CreateSeasonDto } from '../dtos/season/create-season.dto';
import { SeasonStatus } from '../enums/season-status.enum';
import { UpdateSeasonDto } from '../dtos/season/update-season.dto';
import { PaginationOptions } from 'src/common/dtos/pagination/pagination-option.dto';
import { PaginationResult } from 'src/common/dtos/pagination/pagination-result.dto';
import { PaginationMeta } from 'src/common/dtos/pagination/pagination-meta.dto';
import { ResponseCode } from 'src/common/constants/response-code.const';
import { seasonSelectFields } from '../dtos/season/season.dto';
import { TriggerException } from 'src/database/utils/trigger.exception';
import { StepService } from '../step/step.service';
import { addStepDto } from '../dtos/season/add-step.dto';
import { StepDto } from '../dtos/step/step.dto';
import { GetStepDto } from '../dtos/step/get-step.dto';

@Injectable()
export class SeasonService {

    private readonly logger = new Logger(SeasonService.name);

    constructor(
        @InjectRepository(Season) private readonly seasonRepository: Repository<Season>,
        private readonly stepService: StepService,
    ) { }

    async createSeason(farmId: number, createSeasonDto: CreateSeasonDto): Promise<Season> {
        try {
            const season = this.seasonRepository.create({ ...createSeasonDto, farm_id: farmId });
            return await this.seasonRepository.save(season);
        }
        catch (error) {
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

    // todo!("handle when the season is finished")
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

    async getSeasons(farmId: number, paginationOptions: PaginationOptions): Promise<PaginationResult<Season>> {
        try {
            const { page, limit, skip } = paginationOptions;
            const qb = this.seasonRepository.createQueryBuilder("season")
                .select(seasonSelectFields)
                .where("season.farm_id = :farmId", { farmId });

            const totalItems = await qb.getCount();
            const totalPages = Math.ceil(totalItems / limit);
            if (totalPages > 0 && page > totalPages) {
                throw new BadRequestException("Invalid page");
            }

            const seasons = await qb.skip(skip).take(limit).getMany();
            const meta = new PaginationMeta({ paginationOptions, totalItems });
            return new PaginationResult(seasons, meta);
        }
        catch (error) {
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
