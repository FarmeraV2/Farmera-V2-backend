import { Body, Controller, Delete, Post } from '@nestjs/common';
import { NotificationDeviceService } from './notification-device.service';
import { CreateNotificationDeviceDto, DeleteNotificationDeviceDto } from '../dtos/notification-device/notification-device.dto';
import { User } from 'src/common/decorators/user.decorator';
import { UserInterface } from 'src/common/types/user.interface';

@Controller('device')
export class NotificationDeviceController {

    constructor(private readonly notificationDeviceService: NotificationDeviceService) { }

    @Post()
    async createNotificationDevice(@User() user: UserInterface, @Body() createNotificationDeviceDto: CreateNotificationDeviceDto) {
        return await this.notificationDeviceService.createDevice(createNotificationDeviceDto, user.id);
    }

    @Delete()
    async deleteNotificationDevice(@User() user: UserInterface, @Body() deleteNotificationDeviceDto: DeleteNotificationDeviceDto) {
        return await this.notificationDeviceService.removeDevice(deleteNotificationDeviceDto.device_id, user.id);
    }
}
