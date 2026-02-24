import { Injectable } from '@nestjs/common';
import bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class HashService {
    async hashPassword(password: string): Promise<string> {
        const saltOrRounds = 10;
        return await bcrypt.hash(password, saltOrRounds);
    }

    async comparePassword(password: string, hash: string): Promise<boolean> {
        return await bcrypt.compare(password, hash);
    }

    encryptFileBuffer(buffer: Buffer, key: Buffer) {
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

        const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
        const tag = cipher.getAuthTag();

        return { encrypted, iv, tag };
    }

    decryptFileBuffer(payload: Buffer, key: Buffer) {
        const iv = payload.subarray(0, 12);
        const tag = payload.subarray(12, 28);
        const encrypted = payload.subarray(28);

        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(tag);

        return Buffer.concat([decipher.update(encrypted), decipher.final()]);
    }

}
