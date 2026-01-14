import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { LogService } from './log.service';
import { Roles } from 'src/common/decorators/role.decorator';
import { UserRole } from 'src/common/enums/role.enum';
import { ListLogDto } from '../dtos/log/list-log.dto';
import { User } from 'src/common/decorators/user.decorator';
import { UserInterface } from 'src/common/types/user.interface';
import { AddLogDto } from '../dtos/log/add-log.dto';

@Controller('log')
export class LogController {

    constructor(private readonly logService: LogService) { }

    @Roles([UserRole.ADMIN])
    @Get()
    async getLogs(@Query() listLogDto: ListLogDto) {
        return await this.logService.listLogs(listLogDto);
    }

    @Roles([UserRole.ADMIN])
    @Get(":id")
    async getLog(@Param("id") id: number) {
        return await this.logService.getLog(id);
    }

    @Roles([UserRole.FARMER])
    @Post()
    async addLog(@User() user: UserInterface, @Body() addLogDto: AddLogDto) {
        return await this.logService.addLog(user.farm_id!, addLogDto);
    }
}
