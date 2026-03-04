import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { UserRole } from 'src/common/enums/role.enum';
import { RegisterAuditorDto } from '../dtos/auditor-profile/register-auditor.dto';
import { Roles } from 'src/common/decorators/role.decorator';
import { VerificationService } from './verification.service';
import { User } from 'src/common/decorators/user.decorator';
import { UserInterface } from 'src/common/types/user.interface';
import { SubmitVoteDto } from '../dtos/verification/submit-vote.dto';
import { GetVerificationDto } from '../dtos/verification/get-verification.dto';

@Controller('verification')
@Roles([UserRole.AUDITOR])
export class VerificationController {

    constructor(private readonly verificationService: VerificationService) { }

    @Get()
    async getPendingVerifications(@User() user: UserInterface, @Query() dto: GetVerificationDto) {
        // console.log(user);
        return await this.verificationService.getPendingVerificationsByUser(user.id, dto);
    }

    @Get(':requestId/package')
    async getVerificationPackage(@Param('requestId') requestId: number, @User() user: UserInterface) {
        return await this.verificationService.getVerificationPackage(requestId, user.id);
    }

    @Patch(':requestId')
    async setVerified(@Param('requestId') requestId: number, @User() user: UserInterface, @Body() submitVote: SubmitVoteDto) {
        return await this.verificationService.setVerified(requestId, user.id, submitVote);
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
