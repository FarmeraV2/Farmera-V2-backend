import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
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

@Controller('season')
@Roles([UserRole.FARMER])
export class SeasonController {

    constructor(private readonly seasonService: SeasonService) { }

    @Post()
    async createSeason(@User() user: UserInterface, @Body() createSeasonDto: CreateSeasonDto) {
        return await this.seasonService.createSeason(user.farm_id!, createSeasonDto);
    }

    @Put(":seasonId")
    async updateSeason(@Param("seasonId") seasonId: number, @User() user: UserInterface, @Body() updateSeasonDto: UpdateSeasonDto) {
        return await this.seasonService.updateSeason(user.farm_id!, seasonId, updateSeasonDto);
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

    @Public()
    @Get("step/:stepId/log")
    async getLogs(@Param("stepId") stepId: number) {
        return await this.seasonService.getLogs(stepId);
    }
}
