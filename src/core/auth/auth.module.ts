import { Module } from '@nestjs/common';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { VerificationController } from './verification/verification.controller';
import { VerificationService } from './verification/verification.service';
import { UserModule } from 'src/modules/user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Verification } from './entities/verification.entity';
import { MailModule } from '../mail/mail.module';
import { SmsModule } from '../sms/sms.module';
import { ConfigModule } from '@nestjs/config';
import { FarmModule } from 'src/modules/farm/farm.module';

@Module({
    imports: [TypeOrmModule.forFeature([Verification]), ConfigModule, UserModule, FarmModule, MailModule, SmsModule],
    controllers: [AuthController, VerificationController],
    providers: [AuthService, VerificationService],
})
export class AuthModule {}
