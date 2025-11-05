import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { PlotService } from './plot.service';
import { CreatePlotDto } from '../dtos/plot/create-plot.dto';
import { Roles } from 'src/common/decorators/role.decorator';
import { UserRole } from 'src/common/enums/role.enum';
import { User } from 'src/common/decorators/user.decorator';
import { UserInterface } from 'src/common/types/user.interface';
import { GetPlotDto } from '../dtos/plot/get-plot.dto';

@Controller('plot')
@Roles([UserRole.FARMER])
export class PlotController {
    constructor(private readonly plotService: PlotService) { }

    @Post()
    async createPlot(@User() user: UserInterface, @Body() createPlotDto: CreatePlotDto) {
        return await this.plotService.createPlot(user.farm_id!, createPlotDto);
    }

    @Put(":plotId")
    async updatePlot(@User() user: UserInterface, @Param("plotId") plotId: number, @Body() updatePlotDto: CreatePlotDto) {
        return await this.plotService.updatePlot(user.farm_id!, plotId, updatePlotDto);
    }

    @Get()
    async getPlots(@User() user: UserInterface, getPlotsDto: GetPlotDto) {
        return await this.plotService.getPlots(user.farm_id!, getPlotsDto);
    }

    @Delete(":plotId")
    async deletePlot(@User() user: UserInterface, @Param("plotId") plotId: number) {
        return await this.plotService.deletePlot(user.farm_id!, plotId);
    }
}
