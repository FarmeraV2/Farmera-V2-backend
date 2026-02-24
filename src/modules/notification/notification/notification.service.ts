import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SendNotificationDto } from '../dtos/notification/send-notification.dto';
import { SendtemplateNotificationDto } from '../dtos/notification/send-template-notification.dto';
import { Notification } from '../entities/notification.entity';

@Injectable()
export class NotificationService {

    constructor(
        @InjectRepository(Notification) private notificationRepository: Repository<Notification>
    ) { }

    async sendNotification(sendNotificationDto: SendNotificationDto) {
        // get users id

        // get device token if send push

        // send notification

        // insert into notification table

        // insert into notification receiver

        // callback error
    }

    async sendTemplateNotification(sendTemplateNotificationDto: SendtemplateNotificationDto) {
        // get template

        // replace placeholders

        // get users id

        // get device token if send push

        // send notification

        // insert into notification table

        // insert into notification receiver

        // callback error
    }
}
