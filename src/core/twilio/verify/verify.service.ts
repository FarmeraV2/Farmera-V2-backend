import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';
import { CheckStatus } from '../enums/check-status.enum';

const TEMPLATE_ID = "d-53bbae3485334f9f811314401ee1c53a";

@Injectable()
export class VerifyService {
    private readonly logger = new Logger(VerifyService.name);
    private twilioClient: Twilio;
    private verifyServiceSID: string | undefined;

    constructor(private configService: ConfigService) {
        const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
        const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');

        if (!accountSid || !authToken) {
            this.logger.warn('Twilio credentials not found. SMS functionality will be disabled.');
            return;
        }

        this.twilioClient = new Twilio(accountSid, authToken);
        this.verifyServiceSID = this.configService.get<string>('TWILIO_VERIFY_SERVICE_SID');
    }

    async createSmsVerification(to: string): Promise<boolean> {
        try {
            if (!this.twilioClient) {
                this.logger.error('Twilio client not initialized');
                return false;
            }
            if (!this.verifyServiceSID) {
                this.logger.error("Twilio Verify Serivce SID is missing")
                return false;
            }

            const result = await this.twilioClient.verify.v2.services(this.verifyServiceSID).verifications.create({
                channel: "sms",
                to
            })

            this.logger.log(`SMS sent successfully. SID: ${result.sid}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to send SMS: ${error.message}`);
            return false;
        }
    }

    async createSmsVerificationCheck(code: string, to: string): Promise<CheckStatus> {
        try {
            if (!this.twilioClient) {
                this.logger.error('Twilio client not initialized');
                throw new InternalServerErrorException()
            }
            if (!this.verifyServiceSID) {
                this.logger.error("Twilio Verify Serivce SID is missing")
                throw new InternalServerErrorException()
            }
            const verificationCheck = await this.twilioClient.verify.v2
                .services(this.verifyServiceSID)
                .verificationChecks.create({
                    code,
                    to
                });
            return verificationCheck.status as CheckStatus;
        }
        catch (error) {
            this.logger.error(`Failed to check SMS: ${error.message}`)
            throw new InternalServerErrorException("Failed to check verification")
        }
    }

    async createEmailVerification(to: string) {
        try {
            if (!this.twilioClient) {
                this.logger.error('Twilio client not initialized');
                return false;
            }
            if (!this.verifyServiceSID) {
                this.logger.error("Twilio Verify Serivce SID is missing")
                return false;
            }
            const result = await this.twilioClient.verify.v2
                .services(this.verifyServiceSID)
                .verifications.create({
                    channel: "email",
                    channelConfiguration: {
                        template_id: TEMPLATE_ID
                    },
                    to
                });

            this.logger.log(`SMS sent successfully. SID: ${result.sid}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to send Email: ${error.message}`);
            return false;
        }
    }

    async createEmailVerificationCheck(code: string, to: string): Promise<CheckStatus> {
        try {
            if (!this.twilioClient) {
                this.logger.error('Twilio client not initialized');
                throw new InternalServerErrorException()
            }
            if (!this.verifyServiceSID) {
                this.logger.error("Twilio Verify Serivce SID is missing")
                throw new InternalServerErrorException()
            }
            const verificationCheck = await this.twilioClient.verify.v2
                .services(this.verifyServiceSID)
                .verificationChecks.create({
                    code,
                    to
                });
            return verificationCheck.status as CheckStatus
        }
        catch (error) {
            this.logger.error("Failed to send email verification: ", error.message);
            throw new InternalServerErrorException("Failed to check email verification")
        }
    }
}
