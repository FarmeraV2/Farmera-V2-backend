import { HttpService } from '@nestjs/axios';
import { BadRequestException, HttpException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FptIdrCardFrontData, FptIdrFrontResponse } from '../interfaces/fpt-idr-front.interface';
import { promises as fs } from 'fs';
import FormData from 'form-data';
import { catchError, firstValueFrom, map } from 'rxjs';
import { FptBiometricResponse } from '../interfaces/fpt-biometric.interfaces';

@Injectable()
export class BiometricService {
    private readonly logger = new Logger(BiometricService.name);
    private readonly fptApiKey: string;
    private readonly fptIdrUrl: string;
    private readonly fptLivenessUrl: string;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService
    ) {
        const apiKey = this.configService.get<string>('FPT_API_KEY');
        const idrUrl = this.configService.get<string>('FPT_IDR_URL');
        const livenessUrl = this.configService.get<string>('FPT_LIVENESS_URL');

        if (!apiKey) {
            this.logger.warn('FPT API Key is missing in configuration.');
        }
        else this.fptApiKey = apiKey;

        if (!idrUrl) {
            this.logger.warn('FPT IDR URL is missing in configuration.');
        }
        else this.fptIdrUrl = idrUrl;

        if (!livenessUrl) {
            this.logger.warn('FPT Liveness URL is missing in configuration.');
        }
        else this.fptLivenessUrl = livenessUrl;
    }

    async callFptIdrApiForFront(imageFile: Express.Multer.File): Promise<FptIdrCardFrontData[]> {
        let fileBuffer: Buffer;
        const tempFilePathFromMulter = imageFile.path;

        // prepare files
        // this.logger.debug(`[IDR] Processing file: ${imageFile.originalname}, path: ${tempFilePathFromMulter}, buffer available: ${!!imageFile.buffer}`);
        if (tempFilePathFromMulter && imageFile.size > 0) {
            try {
                fileBuffer = await fs.readFile(tempFilePathFromMulter);
                // this.logger.debug(`[IDR] Read file from path: ${tempFilePathFromMulter}`);
            } catch (readError) {
                // this.logger.error(`[IDR] Cannot read uploaded file from path ${tempFilePathFromMulter} for ${imageFile.originalname}: ${readError.message}`, readError.stack);
                throw new InternalServerErrorException(`Reading file error for file '${imageFile.originalname}'`);
            }
        } else if (imageFile.buffer && imageFile.size > 0) {
            fileBuffer = imageFile.buffer;
            // this.logger.debug(`[IDR] Using file buffer directly for ${imageFile.originalname}`);
        } else {
            throw new BadRequestException(`'${imageFile.originalname}' is invalid (missing path or buffer or size = 0).`);
        }

        if (!fileBuffer || fileBuffer.length === 0) {
            throw new InternalServerErrorException(`Invalid buffer for '${imageFile.originalname}'.`);
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

        this.logger.log(`[IDR] Calling FPT IDR API for ${imageFile.originalname}`);

        // call fpt api
        try {
            return firstValueFrom(
                this.httpService.post<FptIdrFrontResponse>(this.fptIdrUrl, formData, { headers })
                    .pipe(
                        map((response) => {
                            const fptData = response.data;
                            // this.logger.debug(`[IDR] Raw response from FPT: ${JSON.stringify(fptData)}`);

                            if (!fptData || typeof fptData.errorCode !== 'number') {
                                // this.logger.error('[IDR] Unexpected response structure from FPT (missing errorCode).');
                                throw new InternalServerErrorException('Unexpected response structure from external service');
                            }

                            // verify & extract data from card
                            if (fptData.errorCode === 0) {
                                if (!fptData.data || !Array.isArray(fptData.data) || fptData.data.length === 0) {
                                    // this.logger.error('[IDR] FPT Success but no card data found in the image.');
                                    throw new BadRequestException('No card data found in the image.');
                                }

                                const cardInfo = fptData.data[0];
                                // this.logger.debug(`[IDR] Card info extracted: type='${cardInfo.type}', type_new='${cardInfo.type_new}'`);

                                const isChipFrontCccd = (cardInfo.type === 'chip_front' || cardInfo.type === 'new') &&
                                    cardInfo.type_new === 'cccd_chip_front';

                                if (isChipFrontCccd) {
                                    // this.logger.log(`[IDR] Successfully extracted chip_front CCCD for ${imageFile.originalname}.`);
                                    return fptData.data;
                                } else {
                                    // this.logger.error(`[IDR] Image is not a chip_front CCCD. Received type: '${cardInfo.type}', type_new: '${cardInfo.type_new}'.`);
                                    throw new BadRequestException(`Image is not a chip_front.`);
                                }
                            } else {
                                this.logger.error(`[IDR] FPT API returned an error. Code: ${fptData.errorCode}, Message: ${fptData.errorMessage}`);
                                throw new BadRequestException(`Invalid image`);
                            }
                        }),
                        catchError((error: any) => {
                            if (error instanceof HttpException) {
                                throw error;
                            }
                            this.logger.error(`[IDR] Unknown error during FPT IDR API call for ${imageFile.originalname}.`, error.stack);
                            throw new InternalServerErrorException(`Unknown error for ${imageFile.originalname}.`);
                        }),
                    )
            );
        }
        catch (error) {
            this.logger.error(error.message);
            throw error;
        }
        finally {
            // this.logger.debug(`[IDR] Finished processing for ${imageFile.originalname}. Multer temp file path (if any): ${tempFilePathFromMulter}`);
        }
    }

    async callFptLivenessApi(
        idCardImageFile: Express.Multer.File,
        liveVideoFile: Express.Multer.File,
    ): Promise<FptBiometricResponse> {
        let idCardImageBuffer: Buffer, liveVideoBuffer: Buffer;

        const idCardImageTempPathFromMulter = idCardImageFile.path;
        const liveVideoTempPathFromMulter = liveVideoFile.path;

        // this.logger.debug(`[Liveness] Processing ID card image: ${idCardImageFile.originalname}, path: ${idCardImageTempPathFromMulter}, buffer available: ${!!idCardImageFile.buffer}`);
        // this.logger.debug(`[Liveness] Processing live video: ${liveVideoFile.originalname}, path: ${liveVideoTempPathFromMulter}, buffer available: ${!!liveVideoFile.buffer}`);

        // validate image
        if (!idCardImageFile || (!idCardImageTempPathFromMulter && !idCardImageFile.buffer) || idCardImageFile.size === 0) {
            // this.logger.error("Invalid file for liveness api");
            throw new BadRequestException('Invalid file');
        }
        try {
            if (idCardImageTempPathFromMulter) {
                idCardImageBuffer = await fs.readFile(idCardImageTempPathFromMulter);
            } else {
                idCardImageBuffer = idCardImageFile.buffer;
            }
            if (!idCardImageBuffer || idCardImageBuffer.length === 0) throw new Error('Invalid buffer');
        } catch (e) {
            // this.logger.error(`[Liveness] Reading file error for ${idCardImageFile.originalname}: ${e.message}`);
            throw new InternalServerErrorException(`Cannot read file ${idCardImageFile.originalname}.`);
        }

        // validate video
        if (!liveVideoFile || (!liveVideoTempPathFromMulter && !liveVideoFile.buffer) || liveVideoFile.size === 0) {
            throw new BadRequestException('Invalid file video liveness');
        }
        try {
            if (liveVideoTempPathFromMulter) {
                liveVideoBuffer = await fs.readFile(liveVideoTempPathFromMulter);
            } else {
                liveVideoBuffer = liveVideoFile.buffer;
            }
            if (!liveVideoBuffer || liveVideoBuffer.length === 0) throw new Error('Buffer video liveness không hợp lệ sau khi đọc.');
        } catch (e) {
            // this.logger.error(`[Liveness] Reading error for file video ${liveVideoFile.originalname}: ${e.message}`);
            throw new InternalServerErrorException(`Cannot read file video ${liveVideoFile.originalname}.`);
        }

        // create form data
        const formData = new FormData();
        formData.append('cmnd', idCardImageBuffer, { filename: idCardImageFile.originalname, contentType: idCardImageFile.mimetype });
        formData.append('video', liveVideoBuffer, { filename: liveVideoFile.originalname, contentType: liveVideoFile.mimetype });
        const headers = { ...formData.getHeaders(), 'api-key': this.fptApiKey };

        // call external api
        try {
            const responseData = await firstValueFrom(
                this.httpService.post<FptBiometricResponse>(this.fptLivenessUrl, formData, { headers })
                    .pipe(
                        map((response) => {
                            const fptData = response.data;
                            if (!fptData || !fptData.code) {
                                throw new InternalServerErrorException('Unexpected response structure from external service');
                            }
                            const topLevelCode = fptData.code;
                            if (topLevelCode !== '200') {
                                const errorMessage = fptData.message || 'Liveness request failed';
                                // this.logger.error(`errorMessage (FPT Code: ${topLevelCode})`);
                                throw new BadRequestException(`${errorMessage}`);
                            }
                            if (!fptData.liveness || fptData.liveness.code !== '200' || typeof fptData.liveness.is_live !== 'string') {
                                throw new InternalServerErrorException('Invalid liveness structure');
                            }
                            if (fptData.liveness.is_live !== 'true') {
                                const livenessMessage = fptData.liveness.message || 'Xác thực người thật thất bại';
                                // this.logger.error(`${livenessMessage} (Liveness Check)`);
                                throw new BadRequestException("Failed to authenticate user");
                            }
                            if (fptData.face_match_error) {
                                // this.logger.error(`Không thể so khớp khuôn mặt: ${fptData.face_match_error.data} (FPT Code: ${fptData.face_match_error.code})`);
                                throw new BadRequestException(`Cannot match the face`);
                            }
                            if (!fptData.face_match || fptData.face_match.code !== '200' || typeof fptData.face_match.isMatch !== 'string') {
                                // this.logger.error('Phản hồi từ FPT Liveness có cấu trúc face_match không hợp lệ.');
                                throw new InternalServerErrorException("Invalid face_match structure");
                            }
                            if (fptData.face_match.isMatch !== 'true') {
                                const faceMatchMessage = fptData.face_match.message || 'Face not match';
                                throw new BadRequestException(`${faceMatchMessage}`);
                            }
                            return fptData;
                        }),
                        catchError((error: any) => {
                            if (error instanceof HttpException) {
                                throw error;
                            }
                            throw new InternalServerErrorException(`Unknow error`);
                        }),
                    ),
            );
            // this.logger.log(`[Liveness] Xác thực Liveness và Face Match thành công cho ${idCardImageFile.originalname}/${liveVideoFile.originalname}.`);
            return responseData;

        }
        catch (error) {
            this.logger.error(error.message);
            throw error;
        }
    }
}
