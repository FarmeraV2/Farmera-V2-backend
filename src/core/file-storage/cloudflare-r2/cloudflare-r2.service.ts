import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3 } from 'aws-sdk';
import { SIGNED_URL_EXP } from 'src/common/constants/constants';
import { ResponseCode } from 'src/common/constants/response-code.const';
import { StoragePermission } from '../enums/storage-permission.enum';
import { FileStorageService } from '../interfaces/file-storage.interface';
import { MediaGroupType } from '../enums/media-group-type.enum';
import { generateFileName } from '../utils/file.util';
import { createReadStream } from 'fs';

@Injectable()
export class CloudflareR2Service implements FileStorageService {

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

    async getSignedUrl(key: string, permission: StoragePermission): Promise<string> {
        if (!this.r2) {
            throw new InternalServerErrorException({
                message: "R2 Storage is disabled",
                code: ResponseCode.STORAGE_IS_DISABLED
            })
        }
        try {
            return await this.r2.getSignedUrlPromise(
                permission === StoragePermission.READ ? "getObject" : "putObject",
                {
                    Bucket: this.bucketName,
                    Key: key,
                    Expires: SIGNED_URL_EXP,
                }
            );
        }
        catch (error) {
            this.logger.error("Failed to get signed url: ", error.message);
            throw new InternalServerErrorException({
                message: "Failed to get signed url",
                code: ResponseCode.FAILED_TO_GET_SIGNED_URL,
            })
        }
    }

    async uploadFile(body: Express.Multer.File[], type: MediaGroupType, subPath?: string, contentType?: string): Promise<string[]> {
        if (!this.r2 || !this.bucketName) {
            throw new InternalServerErrorException({
                message: "R2 Storage is disabled",
                code: ResponseCode.STORAGE_IS_DISABLED
            })
        }

        try {
            const uploadResults = await Promise.all(
                body.map(async (file, _) => {
                    const finalFilename = generateFileName(file);
                    let key = `${type}`;
                    if (subPath) key += `/${subPath}`;
                    key += `/${finalFilename}`;

                    await this.r2!.putObject({
                        Bucket: this.bucketName!,
                        Key: key,
                        Body: createReadStream(file.path),
                        ContentType: file.mimetype || 'application/octet-stream',
                    }).promise();

                    const fileUrl = `https://${this.bucketName}.${this.r2!.endpoint.hostname}/${key}`;
                    this.logger.log(`File uploaded successfully: ${fileUrl}`);
                    return fileUrl;
                }),
            );

            return uploadResults;
        } catch (error) {
            this.logger.error(`Failed to upload file: ${error}`);
            throw error;
        }
    }
}
