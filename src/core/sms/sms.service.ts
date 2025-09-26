import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

@Injectable()
export class SmsService {
    private readonly logger = new Logger(SmsService.name);
    private twilioClient: Twilio;

    constructor(private configService: ConfigService) {
        const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
        const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');

        if (!accountSid || !authToken) {
            this.logger.warn('Twilio credentials not found. SMS functionality will be disabled.');
            return;
        }

        this.twilioClient = new Twilio(accountSid, authToken);
    }

    async sendVerificationCode(phoneNumber: string, code: string): Promise<boolean> {
        const message = `Your Farmera verification code is: ${code}. This code will expire in 10 minutes.`;
        return this.sendSms(phoneNumber, message);
    }

    async sendPasswordResetCode(phoneNumber: string, code: string): Promise<boolean> {
        const message = `Your Farmera password reset code is: ${code}. This code will expire in 10 minutes.`;
        return this.sendSms(phoneNumber, message);
    }

    private async sendSms(to: string, message: string, fromNumber?: string): Promise<boolean> {
        try {
            if (!this.twilioClient) {
                this.logger.error('Twilio client not initialized');
                return false;
            }

            const from = fromNumber || this.configService.get<string>('TWILIO_PHONE_NUMBER');

            if (!from) {
                this.logger.error('No Twilio phone number configured');
                return false;
            }

            const result = await this.twilioClient.messages.create({
                body: message,
                from: from,
                to: to,
            });

            this.logger.log(`SMS sent successfully. SID: ${result.sid}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to send SMS: ${error.message}`);
            return false;
        }
    }
}
