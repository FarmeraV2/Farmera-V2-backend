import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { SeasonService } from './season.service';
import { Roles } from 'src/common/decorators/role.decorator';
import { UserRole } from 'src/common/enums/role.enum';
import { CreateSeasonDto } from '../dtos/season/create-season.dto';
import { UserInterface } from 'src/common/types/user.interface';
import { User } from 'src/common/decorators/user.decorator';
import { UpdateSeasonDto } from '../dtos/season/update-season.dto';
import { PaginationOptions } from 'src/common/dtos/pagination/pagination-option.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { addStepDto } from '../dtos/season/add-step.dto';
import { GetStepDto } from '../dtos/step/get-step.dto';
import { AddLogDto } from '../dtos/log/add-log.dto';

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
    async getSeasons(@Param("farmId") farmId: number, @Query() paginationOptions: PaginationOptions) {
        return await this.seasonService.getSeasons(farmId, paginationOptions);
    }

    @Post(":seasonId/step")
    async addStep(@Param("seasonId") seasonId: number, @Body() addStepDto: addStepDto) {
        return await this.seasonService.addStep(seasonId, addStepDto);
    }

    @Public()
    @Get(":seasonId/step")
    async getSteps(@Param("seasonId") seasonId: number, @Query() getStepDto: GetStepDto) {
        return await this.seasonService.getSteps(seasonId, getStepDto);
    }

    @Public()
    @Get(":seasonId/step/:stepId/verify")
    async verifyStep(@Param("seasonId") seasonId: number, @Param("stepId") stepId: number) {
        return await this.seasonService.verifyStep(seasonId, stepId);
    }

    @Public()
    @Get(":seasonId/step/:stepId/log")
    async getLogs(@Param("seasonId") seasonId: number, @Param("stepId") stepId: number) {
        return await this.seasonService.getLogs(seasonId, stepId);
    }

    @Post(":seasonId/step/:stepId/log")
    async addLog(@User() user: UserInterface, @Param("seasonId") seasonId: number, @Param("stepId") stepId: number, @Body() addLogDto: AddLogDto) {
        return await this.seasonService.addLog(seasonId, stepId, user.farm_id!, addLogDto);
    }
}
