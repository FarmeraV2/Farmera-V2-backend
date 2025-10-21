import { Module } from '@nestjs/common';
import { FcmService } from 'src/core/firebase/fcm/fcm.service';
import { EmailService } from 'src/core/twilio/email/email.service';
import { NotificationService } from './notification/notification.service';
import { UserPreferenceService } from './user-preference/user-preference.service';

@Module({
  providers: [FcmService, EmailService, NotificationService, UserPreferenceService],
  controllers: [],
})
export class NotificationModule { }
