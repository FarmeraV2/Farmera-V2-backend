import { Repository } from 'typeorm';
import { Plot } from '../entities/plot.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { CreatePlotDto } from '../dtos/plot/create-plot.dto';

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
            throw new InternalServerErrorException("Failed to create plot");
        }
    }

    async updatePlot(farmId: number, plotId: number, updatePlot: CreatePlotDto): Promise<Plot> {
        try {
            const plot = await this.plotRepository.findOne({ where: { id: plotId, farm_id: farmId } });
            return await this.plotRepository.save({ ...plot, ...updatePlot });
        }
        catch (error) {
            this.logger.error(error.message);
            throw new InternalServerErrorException("Failed to update plot");
        }
    }

    async getPlots(farmId: number): Promise<Plot[]> {
        try {
            return await this.plotRepository.find({ where: { farm_id: farmId }, order: { updated: "DESC" } });
        }
        catch (error) {
            this.logger.error(error.message);
            throw new InternalServerErrorException("Failed to get plots");
        }
    }

    async deletePlot(farmId: number, plotId: number): Promise<boolean> {
        try {
            const result = await this.plotRepository.delete({ id: plotId, farm_id: farmId })
            if (result.affected && result.affected > 0) {
                return true;
            }
            throw new InternalServerErrorException();
        }
        catch (error) {
            this.logger.error(error.message);
            throw new InternalServerErrorException("Failed to delete plot");
        }
    }
}
