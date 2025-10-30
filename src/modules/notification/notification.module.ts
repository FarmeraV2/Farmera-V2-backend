import { Module } from '@nestjs/common';
import { FcmService } from 'src/core/firebase/fcm/fcm.service';
import { EmailService } from 'src/core/twilio/email/email.service';
import { NotificationService } from './notification/notification.service';
import { UserPreferenceService } from './user-preference/user-preference.service';
import { UserPreferenceController } from './user-preference/user-preference.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserPreference } from './entities/user-preference.entity';
import { Channel } from './entities/channel.entity';
import { NotificationDevice } from './entities/notification-device.entity';
import { NotificationLog } from './entities/notification-log.entity';
import { NotificationReceiver } from './entities/notification-receiver.entity';
import { Notification } from './entities/notification.entity';
import { Template } from './entities/template.entity';
import { PreferenceChannel } from './entities/preference-channel.entity';
import { NotificationDeviceService } from './notification-device/notification-device.service';
import { NotificationDeviceController } from './notification-device/notification-device.controller';
import { RouterModule } from '@nestjs/core';
import { ChannelService } from './channel/channel.service';
import { ChannelController } from './channel/channel.controller';
import { TemplateService } from './template/template.service';
import { TemplateController } from './template/template.controller';
import { FirebaseModule } from 'src/core/firebase/firebase.module';

@Module({
  imports: [
    RouterModule.register([
      {
        path: "notification",
        module: NotificationModule
      }
    ]),
    TypeOrmModule.forFeature([
      UserPreference,
      Channel,
      NotificationDevice,
      NotificationLog,
      NotificationReceiver,
      Notification,
      Template,
      PreferenceChannel
    ],
    )],
  providers: [FcmService, EmailService, NotificationService, UserPreferenceService, NotificationDeviceService, ChannelService, TemplateService, FirebaseModule],
  controllers: [UserPreferenceController, NotificationDeviceController, ChannelController, TemplateController],
  exports: [UserPreferenceService]
})
export class NotificationModule { }
