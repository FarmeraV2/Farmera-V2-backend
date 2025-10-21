import { Body, Controller, Post } from '@nestjs/common';
import { FcmService } from './fcm.service';
import { NotificationDto } from '../dtos/notification.dto';

@Controller('fcm')
export class FcmController {

    constructor(private fcmService: FcmService) { }

    @Post()
    async send(@Body() body: NotificationDto) {

    }

}
