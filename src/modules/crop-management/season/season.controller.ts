import { Body, Controller, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { SeasonService } from './season.service';
import { Roles } from 'src/common/decorators/role.decorator';
import { UserRole } from 'src/common/enums/role.enum';
import { CreateSeasonDto } from '../dtos/season/create-season.dto';
import { UserInterface } from 'src/common/types/user.interface';
import { User } from 'src/common/decorators/user.decorator';
import { UpdateSeasonDto } from '../dtos/season/update-season.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { AddStepDto } from '../dtos/season/add-step.dto';
import { GetSeasonDto } from '../dtos/season/get-season.dto';
import { AddLogDto } from '../dtos/log/add-log.dto';
import { InactiveLogDto } from '../dtos/log/inactive-log.dto';
import { AssignSeasonDto } from 'src/modules/product/dtos/product/assign-season.dto';
import { UpdateProductStatusDto } from 'src/modules/product/dtos/product/update-product-status.dto';

@Controller('season')
@Roles([UserRole.FARMER])
export class SeasonController {

    constructor(private readonly seasonService: SeasonService) { }

    // Seasons
    @Post()
    async createSeason(@User() user: UserInterface, @Body() createSeasonDto: CreateSeasonDto) {
        return await this.seasonService.createSeason(user.farm_id!, createSeasonDto);
    }

    @Put()
    async updateSeason(@User() user: UserInterface, @Body() updateSeasonDto: UpdateSeasonDto) {
        return await this.seasonService.updateSeason(user.farm_id!, updateSeasonDto);
    }

    @Public()
    @Get("farm/:farmId")
    async getSeasons(@Param("farmId") farmId: number, @Query() getSeasonDto: GetSeasonDto) {
        return await this.seasonService.getSeasons(farmId, getSeasonDto);
    }

    @Get("my-farm")
    async getMySeasons(@User() user: UserInterface, @Query() getSeasonDto: GetSeasonDto) {
        return await this.seasonService.getSeasons(user.farm_id!, getSeasonDto);
    }

    @Public()
    @Get(":seasonId")
    async getSeasonDetail(@Param("seasonId") seasonId: number) {
        return await this.seasonService.getSeasonDetail(seasonId);
    }

    @Post("/step")
    async addSeasonStep(@Body() addStepDto: AddStepDto) {
        return await this.seasonService.addSeasonStep(addStepDto);
    }

    // Steps
    @Roles([UserRole.FARMER])
    @Patch("step/:stepId/done")
    async finishStep(@Param("stepId") stepId: number) {
        return await this.seasonService.finishStep(stepId);
    }

    @Public()
    @Get(":seasonId/step")
    async getSeasonSteps(@Param("seasonId") seasonId: number) {
        return await this.seasonService.getSeasonSteps(seasonId);
    }

    @Public()
    @Get(":seasonId/step/:stepId/verify")
    async verifySeasonStep(@Param("seasonId") seasonId: number, @Param("stepId") stepId: number) {
        return await this.seasonService.verifySeasonStep(seasonId, stepId);
    }

    // Logs
    @Public()
    @Get("step/:stepId/log")
    async getLogs(@Param("stepId") stepId: number) {
        return await this.seasonService.getLogs(stepId);
    }

    @Roles([UserRole.FARMER])
    @Post("log")
    async addLog(@User() user: UserInterface, @Body() addLogDto: AddLogDto) {
        return await this.seasonService.addLog(user.farm_id!, addLogDto);
    }

    @Roles([UserRole.FARMER])
    @Patch("log/inactive")
    async unactiveLog(@Body() dto: InactiveLogDto) {
        return await this.seasonService.unactiveLog(dto);
    }

    // Products
    @Roles([UserRole.FARMER])
    @Patch('product/:id/assign')
    async assignSeason(@Param('id') productId: number, @Body() body: AssignSeasonDto) {
        return await this.seasonService.assignSeason(productId, body.season_id);
    }

    @Roles([UserRole.FARMER])
    @Patch('product/:id/status')
    async updateProductStatus(@Param('id') productId: number, @Body() dto: UpdateProductStatusDto) {
        return await this.seasonService.updateProductStatus(productId, dto);
    }
}
