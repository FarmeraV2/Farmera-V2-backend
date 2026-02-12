import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { UserRole } from 'src/common/enums/role.enum';
import { RegisterAuditorDto } from '../dtos/auditor-profile/register-auditor.dto';
import { Roles } from 'src/common/decorators/role.decorator';
import { VerificationService } from './verification.service';
import { User } from 'src/common/decorators/user.decorator';
import { UserInterface } from 'src/common/types/user.interface';

@Controller('verification')
export class VerificationController {

    constructor(private readonly verificationService: VerificationService) { }

    @Get('pending')
    // @Roles([UserRole.AUDITOR])
    async getPendingVerifications(@User() user: UserInterface) {
        return await this.verificationService.getPendingVerificationsByUser(28);
    }

    @Get(':requestId/package')
    // @Roles([UserRole.AUDITOR])
    async getVerificationPackage(@Param('requestId') requestId: number, @User() user: UserInterface) {
        return await this.verificationService.getVerificationPackage(requestId, 28);
    }

    // @Post(':requestId/vote')
    // @Roles([UserRole.AUDITOR])
    // async submitVote(@Param('requestId') requestId: number, @User() user: UserInterface, @Body() dto: SubmitVoteDto) {
    //     return await this.verificationService.recordVote(requestId, user.id, dto.is_valid, dto.transaction_hash);
    // }

    // @Public()
    // @Get('log/:logId/status')
    // async getVerificationStatus(@Param('logId') logId: number) {
    //     return await this.verificationService.getVerificationStatus(logId);
    // }
}
