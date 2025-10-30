import { Module } from '@nestjs/common';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { VerificationController } from './verification/verification.controller';
import { VerificationService } from './verification/verification.service';
import { UserModule } from 'src/modules/user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Verification } from './entities/verification.entity';
import { ConfigModule } from '@nestjs/config';
import { FarmModule } from 'src/modules/farm/farm.module';
import { VerifyService } from '../twilio/verify/verify.service';
import { EmailService } from '../twilio/email/email.service';
import { NotificationModule } from 'src/modules/notification/notification.module';

@Module({
    imports: [TypeOrmModule.forFeature([Verification]), ConfigModule, UserModule, FarmModule, NotificationModule],
    controllers: [AuthController, VerificationController],
    providers: [AuthService, VerificationService, VerifyService, EmailService],
})
export class AuthModule { }
