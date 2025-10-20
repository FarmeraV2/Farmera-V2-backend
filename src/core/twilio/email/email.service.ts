import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sgMail from '@sendgrid/mail';

@Injectable()
export class EmailService {

    private readonly logger = new Logger(EmailService.name);
    private fromEmail: string;

    constructor(private configService: ConfigService) {
        const apiKey = configService.get<string>("TWILIO_SENDGRID_API_KEY")
        const fromEmail = configService.get<string>("FROM_EMAIL")
        if (!apiKey) {
            this.logger.warn("TWILIO_SENDGRID_API_KEY is missing, sendgrid email service will be disable")
        }
        if (!fromEmail) {
            this.logger.warn("FROM_EMAIL is missing, cannot send email")
        }
        sgMail.setApiKey(apiKey!);
        this.fromEmail = fromEmail!
    }

    async sendEmail(to: string, subject: string, text: string, html?: string): Promise<boolean> {
        const msg = {
            to,
            from: this.fromEmail,
            subject,
            text,
            html,
        }
        try {
            const response = await sgMail.send(msg);

            return true;
        }
        catch (error) {
            this.logger.error(error);
            return false;
        }
    }
}
