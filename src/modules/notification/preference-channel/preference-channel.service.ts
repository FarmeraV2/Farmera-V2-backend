import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PreferenceChannel } from '../entities/preference-channel.entity';
import { ChannelService } from '../channel/channel.service';
import { NotificationChannelType } from '../enums/notification-channel-type.enum';
import { ResponseCode } from 'src/common/constants/response-code.const';

@Injectable()
export class PreferenceChannelService {

    private readonly logger = new Logger(PreferenceChannelService.name)

    constructor(
        @InjectRepository(PreferenceChannel) private preferenceChannelRepository: Repository<PreferenceChannel>,
        private readonly channelService: ChannelService,
    ) { }

    async registerNotificationChannel(userId: number): Promise<PreferenceChannel[]> {
        try {
            // get default channel ids
            const ids = await this.channelService.getDefaultChannelIds();
            if (ids.length <= 0) return [];

            const notificationType = [
                { type: NotificationChannelType.EMAIL, active: true },
                { type: NotificationChannelType.PUSH, active: true },
                { type: NotificationChannelType.SMS, active: false }
            ]

            // for each channel, add all type of notification type and bulk insert to preference channel table
            const preferences: PreferenceChannel[] = ids.flatMap((id) => {
                return notificationType.map((type) => {
                    const preference: Partial<PreferenceChannel> = {
                        notification_channel_type: type.type,
                        active: type.active,
                        user_id: userId,
                        channel_id: id,
                    }
                    return this.preferenceChannelRepository.create(preference);
                })
            })
            return await this.preferenceChannelRepository.save(preferences);
        }
        catch (error) {
            this.logger.error("Failed to create channel preference: ", error.message);
            throw new InternalServerErrorException({
                message: "Failed to update user notification preference",
                code: ResponseCode.FAILED_TO_CREATE_USER_PREFERENCE
            })
        }
    }
}