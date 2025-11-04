import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationDevice } from '../entities/notification-device.entity';
import { CreateNotificationDeviceDto } from '../dtos/notification-device/notification-device.dto';
import { ResponseCode } from 'src/common/constants/response-code.const';

@Injectable()
export class NotificationDeviceService {

    private readonly logger = new Logger(NotificationDeviceService.name)

    constructor(
        @InjectRepository(NotificationDevice) private notificationDeviceRepository: Repository<NotificationDevice>
    ) { }

    async createDevice(notificationDeviceDto: CreateNotificationDeviceDto, userId: number): Promise<NotificationDevice> {
        try {
            return await this.notificationDeviceRepository.save({ ...notificationDeviceDto, user_id: userId })
        }
        catch (error) {
            this.logger.error("Failed to create user device: ", error.message);
            throw new InternalServerErrorException({
                message: "Failed to create user device",
                code: ResponseCode.FAILED_TO_CREATE_USER_DEVICE
            })
        }
    }

    async removeDevice(deviceId: string, userId: number): Promise<boolean> {
        try {
            const result = await this.notificationDeviceRepository.update({ device_id: deviceId, user_id: userId }, { is_deleted: true })
            if (result.affected && result.affected > 0) {
                return true;
            }
            return false;
        }
        catch (error) {
            this.logger.error("Failed to remove user device: ", error.message);
            throw new InternalServerErrorException({
                message: 'Failed to remove user device',
                code: ResponseCode.FAILED_TO_REMOVE_USER_DEVICE,
            })
        }
    }

    async getFcmTokens(userId: number): Promise<string[]> {
        try {
            const result = await this.notificationDeviceRepository.find({
                select: ["fcm_token"],
                where: { user_id: userId }
            })
            return result.map((r) => r.fcm_token);
        }
        catch (error) {
            this.logger.error("Failed to get user fcm tokens");
            throw new InternalServerErrorException({
                message: "Failed to get user fcm tokens",
                code: ResponseCode.FAILED_TO_GET_USER_FCM_TOKEN
            })
        }
    }
}
