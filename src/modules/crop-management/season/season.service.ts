import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Season } from '../entities/season.entity';
import { CreateSeasonDto } from '../dtos/season/create-season.dto';
import { SeasonStatus } from '../enums/season-status.enum';
import { UpdateSeasonDto } from '../dtos/season/update-season.dto';
import { PaginationOptions } from 'src/common/dtos/pagination/pagination-option.dto';
import { PaginationResult } from 'src/common/dtos/pagination/pagination-result.dto';
import { PaginationMeta } from 'src/common/dtos/pagination/pagination-meta.dto';

@Injectable()
export class SeasonService {

    private readonly logger = new Logger(SeasonService.name);

    constructor(
        @InjectRepository(Season) private readonly seasonRepository: Repository<Season>
    ) { }

    async createSeason(farmId: number, createSeasonDto: CreateSeasonDto): Promise<Season> {
        try {
            const season = this.seasonRepository.create({ ...createSeasonDto, farm_id: farmId });
            return await this.seasonRepository.save(season);
        }
        catch (error) {
            this.logger.error(error.message);
            throw new InternalServerErrorException("Failed to create season");
        }
    }

    // todo!("handle when the season is finished")
    async updateSeason(farmId: number, seasonId: number, updateSeasonDto: UpdateSeasonDto): Promise<Season> {
        try {
            const { name, notes } = updateSeasonDto;
            const season = await this.seasonRepository.findOneBy({ id: seasonId, farm_id: farmId });
            if (!season) throw new NotFoundException("Season not found");

            // if the seaon is already started
            else if (season.status !== SeasonStatus.PENDING || season.start_date < new Date()) {
                // allowing update only name and notes
                return await this.seasonRepository.save({ ...season, name, notes });
            }
            // allowing update all fields
            return await this.seasonRepository.save({ ...season, ...updateSeasonDto });
        }
        catch (error) {
            this.logger.error(error.message);
            throw new InternalServerErrorException("Failed to update season");
        }
    }

    async getSeasons(farmId: number, paginationOptions: PaginationOptions): Promise<PaginationResult<Season>> {
        try {
            const { page, limit, skip } = paginationOptions;
            const qb = this.seasonRepository.createQueryBuilder("season").where("season.farm_id = :farmId", { farmId });

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
}
