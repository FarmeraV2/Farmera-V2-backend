import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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

        // if (!apiKey) {
        //     this.logger.warn('FPT API Key is missing in configuration.');
        // }
        // this.fptApiKey = apiKey;

        // if (!idrUrl) {
        //     this.logger.warn('FPT IDR URL is missing in configuration.');
        // }
        // this.fptIdrUrl = idrUrl;

        // if (!livenessUrl) {
        //     this.logger.warn('FPT Liveness URL is missing in configuration.');
        // }
        // this.fptLivenessUrl = livenessUrl;

    }

    // async callFptIdrApiForFront(imageFile: Express.Multer.File): Promise<FptIdrCardFrontData[]> {
    //     let fileBuffer: Buffer;
    //     const tempFilePathFromMulter = imageFile.path;

    //     this.logger.debug(`[IDR] Processing file: ${imageFile.originalname}, path: ${tempFilePathFromMulter}, buffer available: ${!!imageFile.buffer}`);

    //     if (tempFilePathFromMulter && imageFile.size > 0) {
    //         try {
    //             fileBuffer = await fs.readFile(tempFilePathFromMulter);
    //             this.logger.debug(`[IDR] Read file from path: ${tempFilePathFromMulter}`);
    //         } catch (readError) {
    //             this.logger.error(`[IDR] Cannot read uploaded file from path ${tempFilePathFromMulter} for ${imageFile.originalname}: ${readError.message}`, readError.stack);
    //             throw new InternalServerErrorException(`Không thể đọc dữ liệu file đã tải lên cho ${imageFile.originalname}.`);
    //         }
    //     } else if (imageFile.buffer && imageFile.size > 0) {
    //         fileBuffer = imageFile.buffer;
    //         this.logger.debug(`[IDR] Using file buffer directly for ${imageFile.originalname}`);
    //     } else {
    //         throw new BadRequestException(`File ảnh '${imageFile.originalname}' không hợp lệ (không có path hoặc buffer, hoặc size = 0).`);
    //     }

    //     if (!fileBuffer || fileBuffer.length === 0) {
    //         throw new InternalServerErrorException(`Không thể lấy buffer file hợp lệ cho ${imageFile.originalname}.`);
    //     }

    //     const formData = new FormData();
    //     formData.append('image', fileBuffer, {
    //         filename: imageFile.originalname,
    //         contentType: imageFile.mimetype,
    //     });

    //     const headers = {
    //         ...formData.getHeaders(),
    //         'api-key': this.fptApiKey,
    //     };

    //     this.logger.log(`[IDR] Calling FPT IDR API for ${imageFile.originalname}`);

    //     try {
    //         return firstValueFrom(
    //             this.httpService.post<FptIdrFrontResponse>(this.fptIdrUrl, formData, { headers })
    //                 .pipe(
    //                     map((response) => {
    //                         const fptData = response.data;
    //                         this.logger.debug(`[IDR] Raw response from FPT: ${JSON.stringify(fptData)}`);

    //                         if (!fptData || typeof fptData.errorCode !== 'number') {
    //                             this.logger.error('[IDR] Unexpected response structure from FPT (missing errorCode).');
    //                             throw new InternalServerErrorException('Phản hồi không mong đợi từ dịch vụ nhận dạng.');
    //                         }

    //                         if (fptData.errorCode === 0) {
    //                             if (!fptData.data || !Array.isArray(fptData.data) || fptData.data.length === 0) {
    //                                 this.logger.warn('[IDR] FPT Success but no card data found in the image.');
    //                                 throw new BadRequestException('Không tìm thấy thông tin thẻ trong ảnh.');
    //                             }

    //                             const cardInfo = fptData.data[0];
    //                             this.logger.debug(`[IDR] Card info extracted: type='${cardInfo.type}', type_new='${cardInfo.type_new}'`);

    //                             const isChipFrontCccd = (cardInfo.type === 'chip_front' || cardInfo.type === 'new') &&
    //                                 cardInfo.type_new === 'cccd_chip_front';

    //                             if (isChipFrontCccd) {
    //                                 this.logger.log(`[IDR] Successfully extracted chip_front CCCD for ${imageFile.originalname}.`);
    //                                 return fptData.data;
    //                             } else {
    //                                 this.logger.warn(`[IDR] Image is not a chip_front CCCD. Received type: '${cardInfo.type}', type_new: '${cardInfo.type_new}'.`);
    //                                 throw new BadRequestException(`Hình ảnh không phải là mặt trước thẻ CCCD có chip.`);
    //                             }
    //                         } else {
    //                             this.logger.error(`[IDR] FPT API returned an error. Code: ${fptData.errorCode}, Message: ${fptData.errorMessage}`);
    //                             throw new BadRequestException(`Hình ảnh không hợp lệ hoặc không thể xử lý (FPT Code: ${fptData.errorCode}, Message: ${fptData.errorMessage}).`);
    //                         }
    //                     }),
    //                     catchError((error: any) => {
    //                         if (error instanceof HttpException) {
    //                             throw error;
    //                         }
    //                         if (error instanceof AxiosError) {
    //                             let statusCodeToThrow = 500;
    //                             let errorMessageToThrow = `Lỗi không mong đợi khi giao tiếp với dịch vụ FPT IDR.`;
    //                             if (error.response) {
    //                                 const status = error.response.status;
    //                                 let specificFptMessage: string | null = null;
    //                                 if (error.response.data && typeof error.response.data === 'object') {
    //                                     const responseData = error.response.data as any;
    //                                     specificFptMessage = responseData.message || responseData.errorMessage || (typeof responseData === 'string' ? responseData : null);
    //                                 } else if (typeof error.response.data === 'string') {
    //                                     specificFptMessage = error.response.data;
    //                                 }

    //                                 this.logger.error(`[IDR] Axios error from FPT. Status: ${status}, Data: ${JSON.stringify(error.response.data)}`);

    //                                 if (status === 400) {
    //                                     statusCodeToThrow = 400;
    //                                     errorMessageToThrow = specificFptMessage || `Dữ liệu gửi đến FPT không hợp lệ (Ảnh có thể không đúng định dạng/chất lượng?).`;
    //                                 } else if (status === 401 || status === 403) {
    //                                     statusCodeToThrow = 500;
    //                                     errorMessageToThrow = `Lỗi cấu hình hoặc xác thực với dịch vụ FPT. Vui lòng liên hệ quản trị viên.`;
    //                                 } else {
    //                                     statusCodeToThrow = 500;
    //                                     errorMessageToThrow = `Dịch vụ FPT gặp lỗi (Status ${status}). ${specificFptMessage ? `Chi tiết: ${specificFptMessage}` : 'Không có chi tiết.'}`;
    //                                 }
    //                             } else if (error.request) {
    //                                 this.logger.error('[IDR] No response received from FPT IDR service.', error.stack);
    //                                 statusCodeToThrow = 502;
    //                                 errorMessageToThrow = `Không thể kết nối hoặc nhận phản hồi từ dịch vụ FPT.`;
    //                             } else {
    //                                 this.logger.error(`[IDR] Error setting up request to FPT IDR service: ${error.message}`, error.stack);
    //                                 statusCodeToThrow = 500;
    //                                 errorMessageToThrow = `Lỗi khi chuẩn bị yêu cầu đến dịch vụ FPT: ${error.message}`;
    //                             }
    //                             switch (statusCodeToThrow) {
    //                                 case 400: throw new BadRequestException(errorMessageToThrow);
    //                                 case 502: throw new HttpException(errorMessageToThrow, 502);
    //                                 default: throw new InternalServerErrorException(errorMessageToThrow);
    //                             }
    //                         }
    //                         this.logger.error(`[IDR] Unknown error during FPT IDR API call for ${imageFile.originalname}.`, error.stack);
    //                         throw new InternalServerErrorException(`Lỗi không xác định khi xử lý yêu cầu FPT IDR cho ${imageFile.originalname}.`);
    //                     }),
    //                 )
    //         );
    //     } finally {
    //         this.logger.debug(`[IDR] Finished processing for ${imageFile.originalname}. Multer temp file path (if any): ${tempFilePathFromMulter}`);
    //     }
    // }


    // async callFptLivenessApi(
    //     idCardImageFile: Express.Multer.File,
    //     liveVideoFile: Express.Multer.File,
    // ): Promise<FptBiometricResponse> {
    //     let idCardImageBuffer: Buffer, liveVideoBuffer: Buffer;

    //     const idCardImageTempPathFromMulter = idCardImageFile.path;
    //     const liveVideoTempPathFromMulter = liveVideoFile.path;

    //     this.logger.debug(`[Liveness] Processing ID card image: ${idCardImageFile.originalname}, path: ${idCardImageTempPathFromMulter}, buffer available: ${!!idCardImageFile.buffer}`);
    //     this.logger.debug(`[Liveness] Processing live video: ${liveVideoFile.originalname}, path: ${liveVideoTempPathFromMulter}, buffer available: ${!!liveVideoFile.buffer}`);


    //     if (!idCardImageFile || (!idCardImageTempPathFromMulter && !idCardImageFile.buffer) || idCardImageFile.size === 0) {
    //         throw new BadRequestException('File ảnh CCCD không hợp lệ.');
    //     }
    //     try {
    //         if (idCardImageTempPathFromMulter) {
    //             idCardImageBuffer = await fs.readFile(idCardImageTempPathFromMulter);
    //         } else {
    //             idCardImageBuffer = idCardImageFile.buffer;
    //         }
    //         if (!idCardImageBuffer || idCardImageBuffer.length === 0) throw new Error('Buffer ảnh CCCD không hợp lệ sau khi đọc.');
    //     } catch (e) {
    //         this.logger.error(`[Liveness] Lỗi đọc file ảnh CCCD ${idCardImageFile.originalname}: ${e.message}`, e.stack);
    //         throw new InternalServerErrorException(`Không thể đọc file ảnh CCCD ${idCardImageFile.originalname}.`);
    //     }

    //     if (!liveVideoFile || (!liveVideoTempPathFromMulter && !liveVideoFile.buffer) || liveVideoFile.size === 0) {
    //         throw new BadRequestException('File video liveness không hợp lệ.');
    //     }
    //     try {
    //         if (liveVideoTempPathFromMulter) {
    //             liveVideoBuffer = await fs.readFile(liveVideoTempPathFromMulter);
    //         } else {
    //             liveVideoBuffer = liveVideoFile.buffer;
    //         }
    //         if (!liveVideoBuffer || liveVideoBuffer.length === 0) throw new Error('Buffer video liveness không hợp lệ sau khi đọc.');
    //     } catch (e) {
    //         this.logger.error(`[Liveness] Lỗi đọc file video ${liveVideoFile.originalname}: ${e.message}`, e.stack);
    //         throw new InternalServerErrorException(`Không thể đọc file video ${liveVideoFile.originalname}.`);
    //     }

    //     const formData = new FormData();
    //     formData.append('cmnd', idCardImageBuffer, { filename: idCardImageFile.originalname, contentType: idCardImageFile.mimetype });
    //     formData.append('video', liveVideoBuffer, { filename: liveVideoFile.originalname, contentType: liveVideoFile.mimetype });
    //     const headers = { ...formData.getHeaders(), 'api-key': this.fptApiKey };

    //     try {
    //         const responseData = await firstValueFrom(
    //             this.httpService.post<FptBiometricResponse>(this.fptLivenessUrl, formData, { headers })
    //                 .pipe(
    //                     map((response) => {
    //                         const fptData = response.data;
    //                         if (!fptData || !fptData.code) {
    //                             throw new InternalServerErrorException('Phản hồi không mong đợi từ dịch vụ Liveness (thiếu mã).');
    //                         }
    //                         const topLevelCode = fptData.code;
    //                         if (topLevelCode !== '200') {
    //                             const errorMessage = fptData.message || 'Yêu cầu Liveness không thành công';
    //                             throw new BadRequestException(`${errorMessage} (FPT Code: ${topLevelCode})`);
    //                         }
    //                         if (!fptData.liveness || fptData.liveness.code !== '200' || typeof fptData.liveness.is_live !== 'string') {
    //                             throw new InternalServerErrorException('Phản hồi từ FPT Liveness có cấu trúc liveness không hợp lệ.');
    //                         }
    //                         if (fptData.liveness.is_live !== 'true') {
    //                             const livenessMessage = fptData.liveness.message || 'Xác thực người thật thất bại';
    //                             throw new BadRequestException(`${livenessMessage} (Liveness Check)`);
    //                         }
    //                         if (fptData.face_match_error) {
    //                             throw new BadRequestException(`Không thể so khớp khuôn mặt: ${fptData.face_match_error.data} (FPT Code: ${fptData.face_match_error.code})`);
    //                         }
    //                         if (!fptData.face_match || fptData.face_match.code !== '200' || typeof fptData.face_match.isMatch !== 'string') {
    //                             throw new InternalServerErrorException('Phản hồi từ FPT Liveness có cấu trúc face_match không hợp lệ.');
    //                         }
    //                         if (fptData.face_match.isMatch !== 'true') {
    //                             const faceMatchMessage = fptData.face_match.message || 'Khuôn mặt không khớp';
    //                             throw new BadRequestException(`${faceMatchMessage} (Face Match)`);
    //                         }
    //                         return fptData;
    //                     }),
    //                     catchError((error: any) => {
    //                         if (error instanceof HttpException) {
    //                             throw error;
    //                         }
    //                         if (error instanceof AxiosError) {
    //                             let statusCodeToThrow = 500;
    //                             let errorMessageToThrow = `Lỗi không mong đợi khi giao tiếp với dịch vụ Liveness.`;
    //                             if (error.response) {
    //                                 const status = error.response.status;
    //                                 let specificFptMessage: string | null = null;
    //                                 if (error.response.data) {
    //                                     const responseData = error.response.data as any;
    //                                     specificFptMessage = responseData.message || responseData.errorMessage || (typeof responseData === 'string' ? responseData : null);
    //                                 }
    //                                 if (status === 400) {
    //                                     statusCodeToThrow = 400;
    //                                     errorMessageToThrow = specificFptMessage || `Dữ liệu gửi đến FPT Liveness không hợp lệ.`;
    //                                 } else if (status === 401 || status === 403) {
    //                                     statusCodeToThrow = 500;
    //                                     errorMessageToThrow = `Lỗi cấu hình/xác thực với dịch vụ Liveness. Liên hệ QTV.`;
    //                                 } else {
    //                                     statusCodeToThrow = 500;
    //                                     errorMessageToThrow = `Dịch vụ FPT Liveness gặp lỗi HTTP (Status ${status}). ${specificFptMessage ? `Chi tiết: ${specificFptMessage}` : ''}`;
    //                                 }
    //                             } else if (error.request) {
    //                                 statusCodeToThrow = 502;
    //                                 errorMessageToThrow = `Không thể kết nối/nhận phản hồi từ dịch vụ Liveness.`;
    //                             } else {
    //                                 statusCodeToThrow = 500;
    //                                 errorMessageToThrow = `Lỗi khi chuẩn bị yêu cầu đến dịch vụ Liveness: ${error.message}`;
    //                             }
    //                             switch (statusCodeToThrow) {
    //                                 case 400: throw new BadRequestException(errorMessageToThrow);
    //                                 case 502: throw new HttpException(errorMessageToThrow, 502);
    //                                 default: throw new InternalServerErrorException(errorMessageToThrow);
    //                             }
    //                         }
    //                         throw new InternalServerErrorException(`Lỗi không xác định khi xử lý FPT Liveness.`);
    //                     }),
    //                 ),
    //         );
    //         this.logger.log(`[Liveness] Xác thực Liveness và Face Match thành công cho ${idCardImageFile.originalname}/${liveVideoFile.originalname}.`);
    //         return responseData;

    //     } finally {

    //     }
    // }
}
