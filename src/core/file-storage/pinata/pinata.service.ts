import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinataSDK } from 'pinata';
import { ResponseCode } from 'src/common/constants/response-code.const';
import { generateFileName } from '../utils/file.util';

@Injectable()
export class PinataService {

    private logger = new Logger(PinataService.name);
    private pinata?: PinataSDK;

    constructor(private readonly configService: ConfigService) {
        const jwt = configService.get<string>('PINATA_JWT');
        const gateway = configService.get<string>('PINATA_GATEWAY');

        if (!jwt || !gateway) {
            this.logger.warn("Pinata storage env is missing, this service is disabled");
            return;
        }

        this.pinata = new PinataSDK({
            pinataJwt: jwt,
            pinataGateway: gateway
        });
    }

    async uploadFile(file: Express.Multer.File): Promise<string> {
        if (!this.pinata) {
            throw new InternalServerErrorException({
                message: "Pinata Storage is disabled",
                code: ResponseCode.STORAGE_IS_DISABLED
            })
        }

        try {
            const filename = generateFileName(file)
            const uint8Array = new Uint8Array(file.buffer);
            const fileToUpload = new File([uint8Array], filename, {
                type: file.mimetype
            });
            const result = await this.pinata.upload.public.file(fileToUpload);
            return result.cid;
        }
        catch (error) {
            this.logger.error('Failed to upload to Pinata: ', error.message);
            throw new InternalServerErrorException({
                message: "Failed to upload JSON to Pinata",
                code: ResponseCode.FAILED_TO_UPLOAD_FILE
            })
        }
    }

    async uploadMutipleFiles(files: Express.Multer.File[]): Promise<string[]> {
        if (!this.pinata) {
            throw new InternalServerErrorException({
                message: "Pinata Storage is disabled",
                code: ResponseCode.STORAGE_IS_DISABLED
            })
        }

        try {
            const uploadPromises = files.map(file => this.uploadFile(file));
            const cids = await Promise.all(uploadPromises);
            return cids;
        }
        catch (error) {
            this.logger.error('Failed to upload to Pinata: ', error.message);
            throw new InternalServerErrorException({
                message: "Failed to upload JSON to Pinata",
                code: ResponseCode.FAILED_TO_UPLOAD_FILE
            })
        }
    }

    async uploadFileArray(folderName: string, files: Express.Multer.File[]): Promise<string> {
        if (!this.pinata) {
            throw new InternalServerErrorException({
                message: "Pinata Storage is disabled",
                code: ResponseCode.STORAGE_IS_DISABLED
            })
        }

        try {
            const date = new Date().getTime();
            const fileToUpload = files.map(file => {
                const filename = generateFileName(file)
                const uint8Array = new Uint8Array(file.buffer);
                return new File([uint8Array], filename, {
                    type: file.mimetype
                })
            });
            const result = await this.pinata.upload.public.fileArray(fileToUpload).name(folderName);
            return result.cid;
        }
        catch (error) {
            this.logger.error('Failed to upload to Pinata: ', error.message);
            throw new InternalServerErrorException({
                message: "Failed to upload JSON to Pinata",
                code: ResponseCode.FAILED_TO_UPLOAD_FILE
            })
        }
    }

    async uploadJson(json: any): Promise<string> {
        if (!this.pinata) {
            throw new InternalServerErrorException({
                message: "Pinata Storage is disabled",
                code: ResponseCode.STORAGE_IS_DISABLED
            })
        }

        try {
            const result = await this.pinata.upload.public.json(json);
            return result.cid;
        }
        catch (error) {
            this.logger.error('Failed to upload JSON to Pinata: ', error.message);
            throw new InternalServerErrorException({
                message: "Failed to upload JSON to Pinata",
                code: ResponseCode.FAILED_TO_UPLOAD_FILE
            })
        }
    }
}