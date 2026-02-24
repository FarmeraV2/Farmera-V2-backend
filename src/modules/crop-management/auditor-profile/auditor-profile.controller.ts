import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AuditorProfileService } from './auditor-profile.service';
import { UserRole } from 'src/common/enums/role.enum';
import { Roles } from 'src/common/decorators/role.decorator';
import { RegisterAuditorDto } from '../dtos/auditor-profile/register-auditor.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { Address } from 'web3';

@Controller('auditor-profile')
export class AuditorProfileController {
    constructor(private readonly auditorProfileService: AuditorProfileService) { }

    @Post('register')
    @Roles([UserRole.ADMIN])
    async registerAuditor(@Body() dto: RegisterAuditorDto) {
        return await this.auditorProfileService.registerAuditor(dto);
    }
}
