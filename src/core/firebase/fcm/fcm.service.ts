import { HttpException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';

import * as admin from "firebase-admin";
import { MessageDto } from '../dtos/fcm/message.dto';
import { MultiCastmessage } from '../dtos/fcm/multicast-message.dto';
import { TopicMessage } from 'firebase-admin/lib/messaging/messaging-api';

@Injectable()
export class FcmService {

    private readonly logger = new Logger(FcmService.name);

    async sendMessage(message: MessageDto) {
        try {
            await admin.messaging().send(message);
        } catch (error) {
            this.logger.error("Send message failed: ", error.message);
            throw error;
        }
    }

    async sendMultiCast(message: MultiCastmessage): Promise<FcmResponse> {
        try {
            const response = await admin.messaging().sendEachForMulticast(message);
            if (response.failureCount > 0) {
                const failedTokens = message.tokens.filter((_, idx) => !response.responses[idx].success)
                return {
                    successCount: response.successCount,
                    failureCount: response.failureCount,
                    failedTokens: failedTokens,
                }
            }
            return {
                successCount: response.successCount,
                failureCount: response.failureCount,
            }
        }
        catch (error) {
            this.logger.error("Send message to multiple devices failed: ", error.message);
            throw error;
        }
    }

    async sendTopic(message: TopicMessage) {
        try {
            await admin.messaging().send(message)
        }
        catch (error) {
            this.logger.error("Failed to send message to topic: ", error.message);
            throw error;
        }
    }

    async subscribeToTopic(tokens: string[], topic: string): Promise<FcmResponse> {
        try {
            const response = await admin.messaging().subscribeToTopic(tokens, topic);
            return {
                successCount: response.successCount,
                failureCount: response.failureCount,
            }
        }
        catch (error) {
            this.logger.error("Failed to subscribe to topic: ", error.message);
            throw error;
        }
    }

    async unsubscribeFromTopic(tokens: string[], topic: string): Promise<FcmResponse> {
        try {
            const response = await admin.messaging().unsubscribeFromTopic(tokens, topic);
            return {
                successCount: response.successCount,
                failureCount: response.failureCount,
            }
        }
        catch (error) {
            this.logger.error("Failed to unsubscribe from topic: ", error.message);
            throw error;
        }
    }
}
