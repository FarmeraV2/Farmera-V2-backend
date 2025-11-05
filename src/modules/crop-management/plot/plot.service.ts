import { Repository } from 'typeorm';
import { Plot } from '../entities/plot.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { CreatePlotDto } from '../dtos/plot/create-plot.dto';
import { ResponseCode } from 'src/common/constants/response-code.const';
import { GetPlotDto } from '../dtos/plot/get-plot.dto';
import { plainToInstance } from 'class-transformer';
import { PaginationTransform } from 'src/common/dtos/pagination/pagination-option.dto';
import { PlotSortFields } from '../enums/plot-sort-fields.enum';
import { PlotDto, plotSelectFields } from '../dtos/plot/plot.dto';
import { applyPagination } from 'src/common/utils/pagination.util';
import { PaginationResult } from 'src/common/dtos/pagination/pagination-result.dto';
import { PaginationMeta } from 'src/common/dtos/pagination/pagination-meta.dto';

@Injectable()
export class PlotService {

    private readonly logger = new Logger(PlotService.name);

    constructor(
        @InjectRepository(Plot) private readonly plotRepository: Repository<Plot>
    ) { }

    async createPlot(farmId: number, createPlotDto: CreatePlotDto): Promise<Plot> {
        try {
            const plot = this.plotRepository.create({ ...createPlotDto, farm_id: farmId });
            return await this.plotRepository.save(plot);
        }
        catch (error) {
            this.logger.error(error.message);
            throw new InternalServerErrorException({
                message: "Failed to create plot",
                code: ResponseCode.FAILED_TO_CREATE_PLOT
            });
        }
    }

    async updatePlot(farmId: number, plotId: number, updatePlot: CreatePlotDto): Promise<Plot> {
        try {
            const plot = await this.plotRepository.findOne({ where: { id: plotId, farm_id: farmId } });
            return await this.plotRepository.save({ ...plot, ...updatePlot });
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
        const { crop_type } = getPlotsDto;
        try {
            const queryBuilder = this.plotRepository.createQueryBuilder("plot").select(plotSelectFields).where("plot.farm_id = :id", { id: farmId });

            if (crop_type) {
                queryBuilder.andWhere("plot.crop_type = :type", { type: crop_type })
            }

            if (sort_by || order) {
                switch (sort_by) {
                    case PlotSortFields.CROP_NAME:
                        queryBuilder.orderBy("plot.crop_name", order);
                        break;
                    case PlotSortFields.PLOT_NAME:
                        queryBuilder.orderBy("plot.plot_name", order);
                        break;
                    default:
                        queryBuilder.orderBy("plot.id", order)
                }
            }

            const totalItems = await applyPagination(queryBuilder, paginationOptions);
            if (totalItems < 0) throw new BadRequestException({
                message: 'Invalid page',
                code: ResponseCode.INVALID_PAGE
            });

            const plots = await queryBuilder.getMany();
            const meta = new PaginationMeta({
                paginationOptions,
                totalItems,
            });
            return new PaginationResult(plainToInstance(PlotDto, plots), meta);
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
}
