import { BadRequestException, ForbiddenException, HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Qr } from './entities/qr.entity';
import { ResponseCode } from 'src/common/constants/response-code.const';
import { v4 as uuidv4 } from 'uuid';
import { QrDto } from './dtos/qr.dto';
import { UpdateQrDto } from './dtos/update-qr.dto';
import * as QRCode from 'qrcode';
import { ConfigService } from '@nestjs/config';
import { VerifyQrDto } from './dtos/verify-qr.dto';
import { QrStatus } from './enums/qr-status';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class QrService {
    private readonly logger = new Logger(QrService.name);
    private appUrl: string | undefined;

    constructor(
        @InjectRepository(Qr) private readonly qrRepository: Repository<Qr>,
        private readonly configService: ConfigService,
    ) {
        const appUrl = configService.get<string>('APP_URL');
        if (!appUrl) {
            this.logger.warn('App url not found, generate qr feature will be disable');
            return;
        }
        this.appUrl = appUrl;
    }

    async createProductQr(productId: number, amount: number): Promise<void> {
        try {
            const qrs = Array.from({ length: amount }, () =>
                this.qrRepository.create({
                    product_id: productId,
                    qr_code: uuidv4(),
                }),
            );
            await this.qrRepository.save(qrs);
        }
        catch (error) {
            this.logger.error(`Failed to create qr: ${error.message}`);
            throw new InternalServerErrorException({
                message: "Internal error",
                code: ResponseCode.INTERNAL_ERROR
            })
        }
    }

    async getProductQrs(productId: number): Promise<QrDto[]> {
        try {
            const qrs = await this.qrRepository.find({
                select: ["id", "qr_code", "product_id", "created", "updated", "activated"],
                where: {
                    product_id: productId
                },
                order: { id: "DESC" }
            })
            return qrs;
        }
        catch (error) {
            this.logger.error(`Failed to get qrs: ${error.message}`);
            throw new InternalServerErrorException({
                message: "Failed to get QR",
                code: ResponseCode.FAILED_TO_GET_QR
            })
        }
    }

    async updateQr(updateDto: UpdateQrDto): Promise<Qr> {
        try {
            const result = await this.qrRepository.update({ id: updateDto.id }, updateDto);
            if (result.affected != 0) {
                const qr = await this.qrRepository.findOneBy({ id: updateDto.id })
                if (!qr) throw new InternalServerErrorException();
                return qr;
            }
            throw new InternalServerErrorException();
        }
        catch (error) {
            this.logger.error(`Failed to update qr: ${error.message}`);
            throw new InternalServerErrorException({
                message: "Failed to update QR",
                code: ResponseCode.FAILED_TO_UPDATE_QR
            })
        }
    }

    async generateQrPng(token: string): Promise<Buffer> {
        if (!this.appUrl) {
            throw new InternalServerErrorException({
                message: "QR Service is disabled",
                code: ResponseCode.INTERNAL_ERROR,
            })
        }
        const url = `${this.appUrl}/api/qr/${token}`;
        return await QRCode.toBuffer(url, {
            type: 'png',
            width: 300,
            margin: 2,
            errorCorrectionLevel: 'H',
        });
    }

    async generateQrBase64(token: string): Promise<string> {
        if (!this.appUrl) {
            throw new InternalServerErrorException({
                message: "QR Service is disabled",
                code: ResponseCode.INTERNAL_ERROR,
            })
        }
        const url = `${this.appUrl}/api/qr/${token}`;
        return QRCode.toDataURL(url, {
            width: 300,
            margin: 2,
            errorCorrectionLevel: 'H',
        });
    }

    async verify(verifyDto: VerifyQrDto): Promise<QrDto> {
        try {
            const qr = await this.qrRepository.findOneBy({
                qr_code: verifyDto.token
            });

            if (!qr) {
                throw new NotFoundException({
                    message: 'QR not found',
                    code: ResponseCode.QR_NOT_FOUND
                });
            }

            if (qr.status === QrStatus.BLOCKED) {
                throw new ForbiddenException({
                    message: 'QR is blocked',
                    code: ResponseCode.QR_BLOCKED
                });
            }

            if (qr.status === QrStatus.CREATED) {
                throw new BadRequestException({
                    message: 'QR is not activated',
                    code: ResponseCode.QR_NOT_ACTIVATED
                });
            }

            qr.scan_count++;

            if (qr.scan_count > 1) {
                qr.status = QrStatus.BLOCKED;
            } else if (qr.status === QrStatus.ACTIVATED) {
                qr.status = QrStatus.VERIFIED;
            }

            const savedQr = await this.qrRepository.save(qr);
            return plainToInstance(QrDto, savedQr);
        }
        catch (error) {
            if (error instanceof HttpException) throw error;
            this.logger.error(`Failed to verify qr: ${error.message}`);
            throw new InternalServerErrorException({
                message: "Failed to verify QR",
                code: ResponseCode.INTERNAL_ERROR
            })
        }
    }

    async activate(verifyDto: VerifyQrDto): Promise<QrDto> {
        try {
            const qr = await this.qrRepository.findOneBy({
                qr_code: verifyDto.token
            });

            if (!qr) {
                throw new NotFoundException({
                    message: 'QR not found',
                    code: ResponseCode.QR_NOT_FOUND
                });
            }

            if (qr.status === QrStatus.CREATED) {
                qr.status = QrStatus.ACTIVATED;
                const savedQr = await this.qrRepository.save(qr);
                return plainToInstance(QrDto, savedQr);
            }

            throw new ForbiddenException({
                message: 'QR is blocked',
                code: ResponseCode.QR_BLOCKED
            });
        }
        catch (error) {
            if (error instanceof HttpException) throw error;
            this.logger.error(`Failed to verify qr: ${error.message}`);
            throw new InternalServerErrorException({
                message: "Failed to verify QR",
                code: ResponseCode.INTERNAL_ERROR
            })
        }
    }
}
