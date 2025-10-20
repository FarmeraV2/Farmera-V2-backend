import { Body, Controller, Post } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { SendVerificationEmailDto, SendVerificationPhoneDto, VerifyEmailDto, VerifyPhoneDto } from '../dtos/verification.dto';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('verification')
export class VerificationController {
    constructor(private readonly verficationService: VerificationService) { }

    @Public()
    @Post('send-email-verification')
    async sendVerificationEmail(@Body() req: SendVerificationEmailDto) {
        return await this.verficationService.sendVerificationEmail(req);
    }

    @Public()
    @Post('verify-email')
    async verifyEmail(@Body() req: VerifyEmailDto) {
        return await this.verficationService.verifyEmail(req);
    }

    @Public()
    @Post('send-phone-verification')
    async sendVerificationPhone(@Body() req: SendVerificationPhoneDto) {
        return await this.verficationService.sendVerificationPhone(req);
    }

    @Public()
    @Post('verify-phone')
    async verifyPhone(@Body() req: VerifyPhoneDto) {
        return await this.verficationService.verifyPhone(req);
    }
}
