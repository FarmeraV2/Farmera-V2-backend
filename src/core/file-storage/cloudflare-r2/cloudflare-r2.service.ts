import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3 } from 'aws-sdk';
import { SIGNED_URL_EXP } from 'src/common/constants/constants';
import { ResponseCode } from 'src/common/constants/response-code.const';

@Injectable()
export class CloudflareR2Service {

    private readonly logger = new Logger(CloudflareR2Service.name);
    private readonly r2?: S3;
    private readonly bucketName?: string;

    constructor(private readonly configService: ConfigService) {
        const accountid = this.configService.get<string>("R2_ACCOUNT_ID");
        const access_key_id = this.configService.get<string>("R2_ACCESS_KEY_ID");
        const access_key_secret = this.configService.get<string>("R2_ACCESS_KEY_SECRET");
        this.bucketName = this.configService.get<string>("R2_BUCKET_NAME")

        if (!accountid || !access_key_id || !access_key_secret || !this.bucketName) {
            this.logger.warn("Cloudflare R2 storage configurations are missing, this service is disabled");
            return;
        }

        this.r2 = new S3({
            endpoint: `https://${accountid}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: `${access_key_id}`,
                secretAccessKey: `${access_key_secret}`,
            },
            signatureVersion: "v4"
        })
    }

    async getGetSignedUrl(key: string): Promise<string> {
        if (!this.r2) {
            throw new InternalServerErrorException({
                message: "R2 Storage is disabled",
                code: ResponseCode.STORAGE_IS_DISABLED
            })
        }
        try {
            return await this.r2.getSignedUrlPromise("getObject", {
                Bucket: this.bucketName,
                Key: key,
                Expires: SIGNED_URL_EXP,
            });
        }
        catch (error) {
            this.logger.error("Failed to get signed url: ", error.message);
            throw new InternalServerErrorException({
                message: "Failed to get signed url",
                code: ResponseCode.FAILED_TO_GET_SIGNED_URL,
            })
        }
    }

    async getPutSignedUrl(key: string): Promise<string> {
        if (!this.r2) {
            throw new InternalServerErrorException({
                message: "R2 Storage is disabled",
                code: ResponseCode.STORAGE_IS_DISABLED
            })
        }
        try {
            return await this.r2.getSignedUrlPromise("putObject", {
                Bucket: this.bucketName,
                Key: key,
                Expires: SIGNED_URL_EXP,
            });
        }
        catch (error) {
            this.logger.error("Failed to get signed url: ", error.message);
            throw new InternalServerErrorException({
                message: "Failed to get signed url",
                code: ResponseCode.FAILED_TO_GET_SIGNED_URL,
            })
        }
    }

}
