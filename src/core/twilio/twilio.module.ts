import { Module } from '@nestjs/common';
import { VerifyService } from './verify/verify.service';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email/email.service';

@Module({
  imports: [ConfigModule],
  providers: [VerifyService, EmailService],
  exports: [VerifyService, EmailService]
})
export class TwilioModule { }
