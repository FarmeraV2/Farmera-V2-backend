import { EntityManager, Repository } from 'typeorm';
import { Plot } from '../entities/plot.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { BadRequestException, HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreatePlotDto } from '../dtos/plot/create-plot.dto';
import { ResponseCode } from 'src/common/constants/response-code.const';
import { GetPlotDto } from '../dtos/plot/get-plot.dto';
import { plainToInstance } from 'class-transformer';
import { PaginationTransform } from 'src/common/dtos/pagination/pagination-option.dto';
import { PlotSortFields } from '../enums/plot-sort-fields.enum';
import { PlotDetailDto, plotDetailSelectFields, PlotDto, plotSelectFields } from '../dtos/plot/plot.dto';
import { applyPagination } from 'src/common/utils/pagination.util';
import { PaginationResult } from 'src/common/dtos/pagination/pagination-result.dto';
import { PaginationMeta } from 'src/common/dtos/pagination/pagination-meta.dto';
import { UpdatePlotDto } from '../dtos/plot/update-plot.dto';
import { SeasonStatus } from '../enums/season-status.enum';
import { SeasonDetailDto } from '../dtos/season/season.dto';

@Injectable()
export class PlotService {

    private readonly logger = new Logger(PlotService.name);

    constructor(
        @InjectRepository(Plot) private readonly plotRepository: Repository<Plot>
    ) { }

    async createPlot(farmId: number, createPlotDto: CreatePlotDto): Promise<PlotDetailDto> {
        try {
            const plot = this.plotRepository.create({ ...createPlotDto, farm_id: farmId });
            const result = await this.plotRepository.save(plot);
            return plainToInstance(PlotDetailDto, result, { excludeExtraneousValues: true });
        }
        catch (error) {
            this.logger.error(error.message);
            throw new InternalServerErrorException({
                message: "Failed to create plot",
                code: ResponseCode.FAILED_TO_CREATE_PLOT
            });
        }
    }

    async updatePlot(farmId: number, updatePlot: UpdatePlotDto): Promise<PlotDetailDto> {
        try {
            const plot = await this.plotRepository.findOne({ where: { id: updatePlot.id, farm_id: farmId } });
            if (!plot) throw new NotFoundException({
                message: "Plot not found",
                code: ResponseCode.PLOT_NOT_FOUND,
            })
            const result = await this.plotRepository.save({ ...plot, ...updatePlot });
            return plainToInstance(PlotDetailDto, result, { excludeExtraneousValues: true });
        }
        catch (error) {
            this.logger.error(error.message);
            throw new InternalServerErrorException({
                message: "Failed to update plot",
                code: ResponseCode.FAILED_TO_UPDATE_PLOT
            });
        }
    }

    async getPlots(farmId: number, getPlotsDto: GetPlotDto): Promise<PaginationResult<PlotDto>> {
        const paginationOptions = plainToInstance(PaginationTransform<PlotSortFields>, getPlotsDto)
        // pagination
        const { sort_by, order } = paginationOptions;
        // filter
        const { crop_type, search, crop_id } = getPlotsDto;

        try {
            const queryBuilder = this.plotRepository.createQueryBuilder("plot").select(plotSelectFields).
                where("plot.farm_id = :id", { id: farmId });
            if (search && search.trim() !== '') {
                queryBuilder.andWhere("plot.plot_name ILIKE :search", { search: `%${search}%` });
            }

            if (crop_type) {
                queryBuilder.andWhere("plot.crop_type IN (:...type)", { type: crop_type })
            }

            if (crop_id && crop_id.length > 0) {
                queryBuilder.andWhere("plot.crop_id IN (:...crop_id)", { crop_id })
            }

            if (sort_by || order) {
                switch (sort_by) {
                    case PlotSortFields.CROP_NAME:
                        queryBuilder.orderBy("plot.crop_name", order);
                        break;
                    case PlotSortFields.PLOT_NAME:
                        queryBuilder.orderBy("plot.plot_name", order);
                        break;
                    case PlotSortFields.UPDATED:
                        queryBuilder.orderBy("plot.updated", order);
                        break;
                    default:
                        queryBuilder.orderBy("plot.id", order)
                        break;
                }
            }

            const totalItems = await applyPagination(queryBuilder, paginationOptions);

            const plots = await queryBuilder.getMany();
            const meta = new PaginationMeta({
                paginationOptions,
                totalItems,
            });
            return new PaginationResult(plainToInstance(PlotDto, plots, { excludeExtraneousValues: true }), meta);
        }
        catch (error) {
            this.logger.error(error.message);
            throw new InternalServerErrorException({
                message: "Failed to get plots",
                code: ResponseCode.FAILED_TO_GET_PLOTS,
            });
        }
    }

    async deletePlot(farmId: number, plotId: number): Promise<boolean> {
        try {
            const result = await this.plotRepository.update({ id: plotId, farm_id: farmId }, { is_deleted: true })
            if (result.affected && result.affected > 0) {
                return true;
            }
            throw new InternalServerErrorException();
        }
        catch (error) {
            this.logger.error(error.message);
            throw new InternalServerErrorException({
                message: "Failed to delete plot",
                code: ResponseCode.FAILED_TO_DELETE_PLOT,
            });
        }
    }

    async getPlotDetail(plotId: number): Promise<PlotDetailDto> {
        try {
            const queryBuilder = this.plotRepository.createQueryBuilder("plot").select(plotDetailSelectFields)
                .where("plot.id = :plotId", { plotId });

            const result = await queryBuilder.getOne();
            if (!result) throw new NotFoundException({
                message: "Plot not found",
                code: ResponseCode.PLOT_NOT_FOUND,
            })
            return plainToInstance(PlotDetailDto, result, { excludeExtraneousValues: true });
        }
        catch (error) {
            if (error instanceof HttpException) throw error;
            this.logger.error(error.message);
            throw new InternalServerErrorException({
                message: "Failed to get plot detail",
                code: ResponseCode.FAILED_TO_GET_PLOT_DETAIL,
            });
        }
    }

    async validateAddSeason(plotId: number): Promise<Plot> {
        const plot = await this.plotRepository
            .createQueryBuilder("plot")
            .leftJoin("plot.seasons", "season")
            .leftJoin("plot.crop", "crop")
            .select([
                "plot.id",
                "plot.image_url",
                "crop.id",
                "crop.crop_type",
                "crop.max_seasons",
                "season.id",
                "season.status",
            ])
            .where("plot.id = :plotId", { plotId })
            .orderBy("season.id", "DESC")
            .getOne();

        if (!plot) throw new Error("Plot not found");

        const prevSeason = plot.seasons.length ? plot.seasons[0] : null;
        const seasons = plot.seasons.length;

        if (prevSeason && prevSeason.status !== SeasonStatus.DONE && prevSeason.status !== SeasonStatus.CANCELED) {
            throw new BadRequestException({
                message: "Previous season still in progress",
                code: ResponseCode.PREVIOUS_SEASON_IN_PROGRESS
            })
        }

        if (plot.crop.max_seasons && seasons >= plot.crop.max_seasons) {
            throw new BadRequestException({
                message: `This crop can only have maximum of ${plot.crop.max_seasons} seasons`,
                code: ResponseCode.INVALID_SEASON_FOR_CROP_TYPE
            })
        }

        // if (plot.crop.crop_type === CropType.SHORT_TERM && prevSeason !== null) {
        //     throw new BadRequestException({
        //         message: "Short term crops can not have more than 1 season",
        //         code: ResponseCode.INVALID_SEASON_FOR_CROP_TYPE
        //     })
        // }
        return plot;
    }

    async getPlotCrop(plotId: number): Promise<Plot> {
        try {
            const result = await this.plotRepository.findOne({
                where: { id: plotId },
                relations: ["crop"]
            });
            if (!result) throw new NotFoundException({
                message: "Plot not found",
                code: ResponseCode.PLOT_NOT_FOUND,
            })
            return result;
        }
        catch (error) {
            if (error instanceof HttpException) throw error;
            this.logger.error(`Failed to get plot: ${error.message}`)
            throw new InternalServerErrorException({
                message: "Failed to get plot",
                code: ResponseCode.FAILED_TO_GET_PLOTS
            })
        }
    }

    async updateTransparencyScore(plotId: number, score: number, manager?: EntityManager): Promise<void> {
        try {
            const repo = manager ? manager.getRepository(Plot) : this.plotRepository;
            await repo.update(
                { id: plotId },
                { transparency_score: score })
        }
        catch (error) {
            this.logger.error(`Failed to update plot transparency score: ${error.message}`);
            throw new InternalServerErrorException({
                message: "Failed to update plot transparency score",
                code: ResponseCode.FAILED_TO_UPDATE_PLOT
            })
        }
    }

    async getFarmPlots(farmId: number): Promise<Plot[]> {
        try {
            return await this.plotRepository.find({
                where: { farm_id: farmId }
            })
        }
        catch (error) {
            throw new Error("Failed to get farm plots")
        }
    }
}
