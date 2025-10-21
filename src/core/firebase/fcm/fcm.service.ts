import { HttpException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { NotificationDto } from '../dtos/notification.dto';
import * as admin from "firebase-admin";

@Injectable()
export class FcmService {

    private readonly logger = new Logger(FcmService.name);

    constructor() { }

    async sendNotification(notificationDto: NotificationDto) {

    }
}
