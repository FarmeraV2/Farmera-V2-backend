import { Module } from '@nestjs/common';
import { FcmService } from 'src/core/firebase/fcm/fcm.service';
import { EmailService } from 'src/core/twilio/email/email.service';
import { NotificationService } from './notification/notification.service';
import { TypeOrmModule } from '@nestjs/typeorm';
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
import { PreferenceChannelService } from './preference-channel/preference-channel.service';

@Module({
  imports: [
    RouterModule.register([
      {
        path: "notification",
        module: NotificationModule
      }
    ]),
    TypeOrmModule.forFeature([
      Channel,
      NotificationDevice,
      NotificationLog,
      NotificationReceiver,
      Notification,
      Template,
      PreferenceChannel
    ],
    )],
  providers: [FcmService, EmailService, NotificationService, NotificationDeviceService, ChannelService, TemplateService, FirebaseModule, PreferenceChannelService],
  controllers: [NotificationDeviceController, ChannelController, TemplateController],
  exports: [PreferenceChannelService]
})
export class NotificationModule { }
