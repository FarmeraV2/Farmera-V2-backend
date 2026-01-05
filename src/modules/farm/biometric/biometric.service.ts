import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FptIdrCardFrontData, FptIdrFrontResponse } from '../interfaces/fpt-idr-front.interface';
import { promises as fs } from 'fs';
import FormData from 'form-data';
import { catchError, firstValueFrom, map } from 'rxjs';
import { FptLivenessResponse } from '../interfaces/fpt-liveness.interfaces';
import { AuditService } from 'src/core/audit/audit.service';

@Injectable()
export class BiometricService {
    private readonly logger = new Logger(BiometricService.name);
    private readonly fptApiKey: string;
    private readonly fptIdrUrl: string;
    private readonly fptLivenessUrl: string;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {
        const apiKey = this.configService.get<string>('FPT_API_KEY');
        const idrUrl = this.configService.get<string>('FPT_IDR_URL');
        const livenessUrl = this.configService.get<string>('FPT_LIVENESS_URL');

        if (!apiKey) {
            this.logger.warn('FPT API Key is missing in configuration.');
        } else this.fptApiKey = apiKey;

        if (!idrUrl) {
            this.logger.warn('FPT IDR URL is missing in configuration.');
        } else this.fptIdrUrl = idrUrl;

        if (!livenessUrl) {
            this.logger.warn('FPT Liveness URL is missing in configuration.');
        } else this.fptLivenessUrl = livenessUrl;
    }

    async callFptIdrApiForFront(imageFile: Express.Multer.File): Promise<FptIdrCardFrontData[]> {
        if (!this.fptApiKey || !this.fptIdrUrl) {
            throw new Error('FPT API key or API endpoint is missing');
        }

        let fileBuffer: Buffer;
        const tempFilePathFromMulter = imageFile.path;

        // prepare files
        // this.logger.debug(`[IDR] Processing file: ${imageFile.originalname}, path: ${tempFilePathFromMulter}, buffer available: ${!!imageFile.buffer}`);
        if (tempFilePathFromMulter && imageFile.size > 0) {
            try {
                fileBuffer = await fs.readFile(tempFilePathFromMulter);
                // this.logger.debug(`[IDR] Read file from path: ${tempFilePathFromMulter}`);
            } catch {
                // this.logger.error(`[IDR] Cannot read uploaded file from path ${tempFilePathFromMulter} for ${imageFile.originalname}: ${readError.message}`, readError.stack);
                throw new Error(`Reading file error for file '${imageFile.originalname}'`);
            }
        } else if (imageFile.buffer && imageFile.size > 0) {
            fileBuffer = imageFile.buffer;
            // this.logger.debug(`[IDR] Using file buffer directly for ${imageFile.originalname}`);
        } else {
            throw new Error(`'${imageFile.originalname}' is invalid (missing path or buffer or size = 0).`);
        }

        if (!fileBuffer || fileBuffer.length === 0) {
            throw new Error(`Invalid buffer for '${imageFile.originalname}'.`);
        }

        // create formdata
        const formData = new FormData();
        formData.append('image', fileBuffer, {
            filename: imageFile.originalname,
            contentType: imageFile.mimetype,
        });

        const headers = {
            ...formData.getHeaders(),
            'api-key': this.fptApiKey,
        };

        // this.logger.log(`[IDR] Calling FPT IDR API for ${imageFile.originalname}`);

        // call fpt api
        try {
            return firstValueFrom(
                this.httpService.post<FptIdrFrontResponse>(this.fptIdrUrl, formData, { headers }).pipe(
                    map((response) => {
                        const fptData = response.data;
                        // this.logger.debug(`[IDR] Raw response from FPT: ${JSON.stringify(fptData)}`);

                        if (!fptData || typeof fptData.errorCode !== 'number') {
                            // this.logger.error('[IDR] Unexpected response structure from FPT (missing errorCode).');
                            throw new Error('Unexpected response structure from external service');
                        }

                        // verify & extract data from card
                        if (fptData.errorCode === 0) {
                            if (!fptData.data || !Array.isArray(fptData.data) || fptData.data.length === 0) {
                                throw new Error('No card data found in the image.');
                            }

                            const cardInfo = fptData.data[0];

                            const isChipFrontCccd =
                                (cardInfo.type === 'chip_front' || cardInfo.type === 'new') && cardInfo.type_new === 'cccd_chip_front';

                            if (isChipFrontCccd) {
                                return fptData.data;
                            } else {
                                throw new Error(`Image is not a chip_front.`);
                            }
                        } else {
                            throw new Error(`Invalid image`);
                        }
                    }),
                    catchError((error: any) => {
                        if (error.response && error.response.data) {
                            const errData = error.response.data;
                            this.logger.error(`FPT errorCode: ${errData.errorCode}, message: ${errData.errorMessage}`);
                            throw new Error(`FPT error: ${errData.errorMessage}`);
                        } else {
                            this.logger.error(error.message);
                            throw new Error(`Unknown error: ${error.message}`);
                        }
                    }),
                ),
            );
        } catch (error) {
            this.logger.error(error.message);
            throw error;
        }
    }

    async callFptLivenessApi(idCardImageFile: Express.Multer.File, liveVideoFile: Express.Multer.File): Promise<FptLivenessResponse> {
        if (!this.fptApiKey || !this.fptLivenessUrl) {
            throw new Error('FPT API key or API endpoint is missing');
        }

        let idCardImageBuffer: Buffer, liveVideoBuffer: Buffer;

        const idCardImageTempPathFromMulter = idCardImageFile.path;
        const liveVideoTempPathFromMulter = liveVideoFile.path;

        // validate image
        if (!idCardImageFile || (!idCardImageTempPathFromMulter && !idCardImageFile.buffer) || idCardImageFile.size === 0) {
            throw new Error('Invalid file');
        }

        if (idCardImageTempPathFromMulter) {
            idCardImageBuffer = await fs.readFile(idCardImageTempPathFromMulter);
        } else {
            idCardImageBuffer = idCardImageFile.buffer;
        }
        if (!idCardImageBuffer || idCardImageBuffer.length === 0) throw new Error('Invalid buffer');

        // validate video
        if (!liveVideoFile || (!liveVideoTempPathFromMulter && !liveVideoFile.buffer) || liveVideoFile.size === 0) {
            throw new Error('Invalid file video liveness');
        }

        if (liveVideoTempPathFromMulter) {
            liveVideoBuffer = await fs.readFile(liveVideoTempPathFromMulter);
        } else {
            liveVideoBuffer = liveVideoFile.buffer;
        }

        if (!liveVideoBuffer || liveVideoBuffer.length === 0) throw new Error('Buffer video liveness không hợp lệ sau khi đọc.');

        const formData = new FormData();
        formData.append('cmnd', idCardImageBuffer, { filename: idCardImageFile.originalname, contentType: idCardImageFile.mimetype });
        formData.append('video', liveVideoBuffer, { filename: liveVideoFile.originalname, contentType: liveVideoFile.mimetype });
        const headers = { ...formData.getHeaders(), 'api-key': this.fptApiKey };

        // call external api
        try {
            const responseData = await firstValueFrom(
                this.httpService.post<FptLivenessResponse>(this.fptLivenessUrl, formData, { headers }).pipe(
                    map((response) => {
                        const fptData = response.data;
                        if (!fptData || !fptData.code) {
                            throw new Error('Unexpected response structure from external service');
                        }
                        const topLevelCode = fptData.code;
                        if (topLevelCode !== '200') {
                            const errorMessage = fptData.message || 'Liveness request failed';
                            throw new Error(`${errorMessage}`);
                        }
                        if (!fptData.liveness || fptData.liveness.code !== '200' || typeof fptData.liveness.is_live !== 'string') {
                            throw new Error('Invalid liveness structure');
                        }
                        if (fptData.liveness.is_live !== 'true') {
                            throw new Error('Failed to authenticate user');
                        }
                        if (fptData.face_match_error) {
                            throw new Error(`Cannot match the face`);
                        }
                        if (!fptData.face_match || fptData.face_match.code !== '200' || typeof fptData.face_match.isMatch !== 'string') {
                            throw new Error('Invalid face_match structure');
                        }
                        if (fptData.face_match.isMatch !== 'true') {
                            throw new Error(fptData.face_match.message || 'Face not match');
                        }
                        return fptData;
                    }),
                    catchError((error: any) => {
                        if (error.response && error.response.data) {
                            const errData = error.response.data;
                            this.logger.error(`FPT errorCode: ${errData.errorCode}, message: ${errData.errorMessage}`);
                            throw new Error(`FPT error: ${errData.errorMessage}`);
                        } else {
                            this.logger.error(error.message);
                            throw new Error(`Unknown error: ${error.message}`);
                        }
                    }),
                ),
            );
            return responseData;
        } catch (error) {
            this.logger.error(error.message);
            throw error;
        }
    }
}
