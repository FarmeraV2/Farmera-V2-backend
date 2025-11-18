import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { LogService } from './log.service';
import { Roles } from 'src/common/decorators/role.decorator';
import { UserRole } from 'src/common/enums/role.enum';
import { ListLogDto } from '../dtos/log/list-log.dto';

@Controller('log')
@Roles([UserRole.ADMIN])
export class LogController {

    constructor(private readonly logService: LogService) { }

    @Get()
    async getLogs(@Query() listLogDto: ListLogDto) {
        return await this.logService.listLogs(listLogDto);
    }

    @Get(":id")
    async getLog(@Param("id") id: number) {
        return await this.logService.getLog(id);
    }
}
