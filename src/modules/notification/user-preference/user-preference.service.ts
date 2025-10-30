import { ForbiddenException, HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm'
import { UserPreference } from '../entities/user-preference.entity';
import { ResponseCode } from 'src/common/constants/response-code.const';
import { UpdateUserPreferenceDto } from '../dtos/user-preference/update-user-preference.dto';
import { PreferenceChannel } from '../entities/preference-channel.entity';
import { ChannelService } from '../channel/channel.service';
import { NotificationChannelType } from '../enums/notification-channel-type.enum';
import { UpdatePreferenceChannelDto } from '../dtos/user-preference/update-preference-channel.dto';
import { FcmService } from 'src/core/firebase/fcm/fcm.service';
import { NotificationDeviceService } from '../notification-device/notification-device.service';

@Injectable()
export class UserPreferenceService {

    private readonly logger = new Logger(UserPreference.name)

    constructor(
        @InjectRepository(UserPreference) private userPreferenceRepository: Repository<UserPreference>,
        @InjectRepository(PreferenceChannel) private preferenceChannelRepository: Repository<PreferenceChannel>,
        private readonly channelService: ChannelService,
        private readonly notificationDeviceService: NotificationDeviceService,
        private readonly fcmService: FcmService,
        private readonly dataSource: DataSource,
    ) { }

    async createUserNotificationPreference(userId: number): Promise<UserPreference> {
        return await this.dataSource.transaction(async (manager) => {
            try {
                const userPreferenceRepo = manager.getRepository(UserPreference);
                const preferenceChannelRepo = manager.getRepository(PreferenceChannel);

                const preference = await userPreferenceRepo.save({ user_id: userId })
                const channels = await this.addChannels(preference.id, preferenceChannelRepo);
                if (channels.length > 0) {
                    this.logger.log("Add default channels successfully")
                }

                return preference;
            }
            catch (error) {
                this.logger.error("Failed to register user notification preference: ", error.message);
                throw new InternalServerErrorException({
                    message: `Failed to register user notification preference for user id: ${userId}`,
                    code: ResponseCode.FAILED_TO_CREATE_USER_PREFERENCE
                });
            }
        });
    }

    async updateUserNotificationPreference(newPreference: UpdateUserPreferenceDto): Promise<UserPreference> {
        try {
            const preference = this.userPreferenceRepository.create(newPreference);
            return await this.userPreferenceRepository.save(preference);
        }
        catch (error) {
            this.logger.error("Failed to update user notification preference: ", error.message);
            throw new InternalServerErrorException({
                message: "Failed to update user notification preference",
                code: ResponseCode.FAILED_TO_CREATE_USER_PREFERENCE
            })
        }
    }

    async getUserPreference(userId: number): Promise<UserPreference> {
        try {
            const result = await this.userPreferenceRepository.findOne({ where: { user_id: userId } });
            if (!result) {
                throw new NotFoundException({
                    message: "User notification preference not found",
                    code: ResponseCode.USER_PREFERENCE_NOT_FOUND
                })
            }
            return result;
        }
        catch (error) {
            if (error instanceof HttpException) throw error;
            this.logger.error(`Failed to get user ${userId} notification preference`);
            throw new InternalServerErrorException({
                message: `Failed to get user ${userId} notification preference`,
                code: ResponseCode.FAILED_TO_GET_USER_ADDRESS
            })
        }
    }

    async addChannels(preferenceId: number, repo?: Repository<PreferenceChannel>): Promise<PreferenceChannel[]> {
        try {
            const repository = repo ?? this.preferenceChannelRepository;
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
                        user_preference_id: preferenceId,
                        channel_id: id,
                    }
                    return this.preferenceChannelRepository.create(preference);
                })
            })
            return await repository.save(preferences);
        }
        catch (error) {
            this.logger.error("Failed to create channel preference: ", error.message);
            throw new InternalServerErrorException({
                message: "Failed to update user notification preference",
                code: ResponseCode.FAILED_TO_CREATE_USER_PREFERENCE
            })
        }
    }

    async updateChannels(prefId: number, userId: number, updateDtos: UpdatePreferenceChannelDto[]) {
        try {
            // get preference id & validate user
            const validate = await this.userPreferenceRepository.existsBy({ user_id: userId, id: prefId })
            if (!validate) {
                throw new ForbiddenException({
                    message: "Update channel is not allowed",
                    code: ResponseCode.FORBIDDEN
                });
            }
            // update preference channel
            const ids = updateDtos.map((dto) => dto.channel_id);
            const cases = updateDtos.map((dto) => `WHEN ${dto.channel_id} THEN ${dto.active}`).join(" ")
            const query = `
                UPDATE preference_channel
                SET CASE ${cases}
                WHERE id IN ${ids} AND 
            `;
            await this.preferenceChannelRepository.query(query);

            // get fcm & subscribe
            const preferenceChannels = await this.preferenceChannelRepository.find({ where: { id: prefId, notification_channel_type: NotificationChannelType.PUSH } });
            if (preferenceChannels.length > 0) {
                const tokens = await this.notificationDeviceService.getFcmTokens(userId);
                preferenceChannels.forEach(async (prefChannel) => {
                    setTimeout(() => {
                        void (async () => {
                            if (prefChannel.active) {
                                await this.fcmService.subscribeToTopic(tokens, prefChannel.channel_id.toString());
                            }
                            else {
                                await this.fcmService.unsubscribeFromTopic(tokens, prefChannel.channel_id.toString())
                            }
                        })()
                    }, 0);
                });
            }
        }
        catch (error) {
            throw new InternalServerErrorException({
                message: "Failed to update channel subcription",
                code: ResponseCode.FAILED_TO_UPDATE_CHANNEL_SUBSCRIPTION
            })
        }
    }
}
