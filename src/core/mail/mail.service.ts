import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
    async sendEmail(to: string, subject: string, text: string, html: string) {
        // todo!("Implement")
        console.log(to, subject, text, html);
        console.log('sendEmail');
        return Promise.resolve();
    }
}
