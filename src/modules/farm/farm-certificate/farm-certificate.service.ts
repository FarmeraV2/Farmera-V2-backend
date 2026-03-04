import { HttpException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FarmCertificate } from '../entities/farm-certificate.entity';
import { DataSource, EntityManager, In, IsNull, Not, Repository } from 'typeorm';
import { FarmCertificateDto } from '../dtos/farm-cert/farm-certificate.dto';
import { ResponseCode } from 'src/common/constants/response-code.const';
import { FarmService } from '../farm/farm.service';
import { FarmStatus } from '../enums/farm-status.enum';
import { GetCertDto } from '../dtos/farm-cert/get-cert.dto';
import { CertificateStatus } from '../enums/certificate-status.enum';

@Injectable()
export class FarmCertificateService {

    private readonly logger = new Logger(FarmCertificateService.name);

    constructor(
        @InjectRepository(FarmCertificate) private farmCertRepository: Repository<FarmCertificate>,
        private readonly farmService: FarmService,
        private readonly dataSource: DataSource
    ) { }

    async getFarmCertificate(farmId: number, getCertDto: GetCertDto): Promise<FarmCertificate[]> {
        try {
            return await this.farmCertRepository.find({
                where: {
                    farm_id: farmId,
                    is_deleted: false,
                    status: getCertDto.status ? In(getCertDto.status) : Not(IsNull())
                }
            })
        } catch (error) {
            if (error instanceof HttpException) throw error;
            this.logger.error(error.message);
            throw new InternalServerErrorException({
                message: 'Failed to get certificates',
                code: ResponseCode.FAILED_TO_GET_CERTIFICATES,
            });
        }
    }

    async addCertificates(farmId: number, certDto: FarmCertificateDto[]): Promise<FarmCertificateDto[]> {
        try {
            return await this.dataSource.transaction(async (manager) => {
                const certs = certDto.map((dto) =>
                    manager.create(FarmCertificate, { farm_id: farmId, ...dto })
                );
                await this.farmService.updateFarmStatus(farmId, FarmStatus.PENDING_APPROVE, manager);
                return await this.farmCertRepository.save(certs);
            });
        } catch (error) {
            if (error instanceof HttpException) throw error;
            this.logger.error(error.message);
            throw new InternalServerErrorException({
                message: 'Failed to add certificates',
                code: ResponseCode.FAILED_TO_ADD_CERTIFICATE,
            });
        }
    }

    async updateCertsStatus(farmId: number, status: CertificateStatus, manager?: EntityManager): Promise<void> {
        const repo = manager ? manager.getRepository(FarmCertificate) : this.farmCertRepository;
        try {
            await repo.update({ farm_id: farmId, status: CertificateStatus.PENDING }, { status: status });
        } catch (error) {
            if (error instanceof HttpException) throw error;
            this.logger.error(error.message);
            throw new InternalServerErrorException({
                message: 'Failed to update certificates',
                code: ResponseCode.FAILED_TO_UPDATE_CERTIFICATE,
            });
        }
    }
}
