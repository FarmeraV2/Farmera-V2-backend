import { Controller, Get, Post } from '@nestjs/common';
import { LogService } from './log.service';
import { Roles } from 'src/common/decorators/role.decorator';
import { UserRole } from 'src/common/enums/role.enum';

@Controller('log')
@Roles([UserRole.FARMER])
export class LogController {

    constructor(private readonly logService: LogService) { }

    @Post()
    async addLog() {

    }

    @Get()
    async getLogs() { }
}
