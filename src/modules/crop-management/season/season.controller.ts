import { Body, Controller, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { SeasonService } from './season.service';
import { Roles } from 'src/common/decorators/role.decorator';
import { UserRole } from 'src/common/enums/role.enum';
import { CreateSeasonDto } from '../dtos/season/create-season.dto';
import { UserInterface } from 'src/common/types/user.interface';
import { User } from 'src/common/decorators/user.decorator';
import { UpdateSeasonDto } from '../dtos/season/update-season.dto';
import { PaginationOptions } from 'src/common/dtos/pagination/pagination-option.dto';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('season')
export class SeasonController {

    constructor(private readonly seasonService: SeasonService) { }

    @Post()
    @Roles([UserRole.FARMER])
    async createSeason(@User() user: UserInterface, @Body() createSeasonDto: CreateSeasonDto) {
        return await this.seasonService.createSeason(user.farm_id!, createSeasonDto);
    }

    @Put(":seasonId")
    @Roles([UserRole.FARMER])
    async updateSeason(@Param("seasonid") seasonId: number, @User() user: UserInterface, @Body() updateSeasonDto: UpdateSeasonDto) {
        return await this.seasonService.updateSeason(user.farm_id!, seasonId, updateSeasonDto);
    }

    @Public()
    @Get("farm/:farmId")
    async getSeasons(@Param("farmId") farmId: number, @Query() paginationOptions: PaginationOptions) {
        return await this.seasonService.getSeasons(farmId, paginationOptions);
    }
}
