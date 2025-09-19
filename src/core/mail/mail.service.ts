import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
    async sendEmail(to: string, subject: string, text: string, html: string) {
        // todo!("Implement")
        console.log("sendEmail");
    }
}
