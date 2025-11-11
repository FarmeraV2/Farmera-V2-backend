import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { PlotService } from './plot.service';
import { CreatePlotDto } from '../dtos/plot/create-plot.dto';
import { Roles } from 'src/common/decorators/role.decorator';
import { UserRole } from 'src/common/enums/role.enum';
import { User } from 'src/common/decorators/user.decorator';
import { UserInterface } from 'src/common/types/user.interface';
import { GetPlotDto } from '../dtos/plot/get-plot.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { UpdatePlotDto } from '../dtos/plot/update-plot.dto';

@Controller('plot')
export class PlotController {
    constructor(private readonly plotService: PlotService) { }

    @Post()
    @Roles([UserRole.FARMER])
    async createPlot(@User() user: UserInterface, @Body() createPlotDto: CreatePlotDto) {
        return await this.plotService.createPlot(user.farm_id!, createPlotDto);
    }

    @Put(":plotId")
    @Roles([UserRole.FARMER])
    async updatePlot(@User() user: UserInterface, @Param("plotId") plotId: number, @Body() updatePlotDto: UpdatePlotDto) {
        return await this.plotService.updatePlot(user.farm_id!, plotId, updatePlotDto);
    }

    @Get()
    @Roles([UserRole.FARMER])
    async getPlots(@User() user: UserInterface, @Query() getPlotsDto: GetPlotDto) {
        return await this.plotService.getPlots(user.farm_id!, getPlotsDto);
    }

    @Get(":plotId")
    @Public()
    async getPlotDetail(@Param("plotId") plotId: number) {
        return await this.plotService.getPlotDetail(plotId);
    }

    @Delete(":plotId")
    @Roles([UserRole.FARMER])
    async deletePlot(@User() user: UserInterface, @Param("plotId") plotId: number) {
        return await this.plotService.deletePlot(user.farm_id!, plotId);
    }
}
