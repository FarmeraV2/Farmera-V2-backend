import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ResponseCode } from 'src/common/constants/response-code.const';
import { PaginationResult } from 'src/common/dtos/pagination/pagination-result.dto';
import { UserRole } from 'src/common/enums/role.enum';
import { CreateApprovalDto } from 'src/modules/farm/dtos/approval/create-approval.dto';
import { GetCertDto } from 'src/modules/farm/dtos/farm-cert/get-cert.dto';
import { AdminFarmDetailDto, FarmListResponseDto } from 'src/modules/farm/dtos/farm/farm.dto';
import { ListFarmDto } from 'src/modules/farm/dtos/farm/list-farm.dto';
import { FarmCertificate } from 'src/modules/farm/entities/farm-certificate.entity';
import { ApprovalAction } from 'src/modules/farm/enums/approval-action.enum';
import { CertificateStatus } from 'src/modules/farm/enums/certificate-status.enum';
import { FarmStatus } from 'src/modules/farm/enums/farm-status.enum';
import { FarmApprovalService } from 'src/modules/farm/farm-approval/farm-approval.service';
import { FarmCertificateService } from 'src/modules/farm/farm-certificate/farm-certificate.service';
import { FarmService } from 'src/modules/farm/farm/farm.service';
import { UserService } from 'src/modules/user/user/user.service';
import { DataSource } from 'typeorm';

@Injectable()
export class FarmManagementService {

    private readonly logger = new Logger(FarmManagementService.name);

    constructor(
        private readonly farmService: FarmService,
        private readonly farmApprovalService: FarmApprovalService,
        private readonly farmCertificateService: FarmCertificateService,

        private readonly dataSource: DataSource
    ) { }

    async createApproval(userId: number, farmId: number, createApprovalDto: CreateApprovalDto): Promise<boolean> {
        try {
            await this.dataSource.transaction(async (manager) => {
                const approval = await this.farmApprovalService.createApproval(userId, createApprovalDto, manager);
                console.log(approval);
                switch (approval.action) {
                    case ApprovalAction.APPROVED:
                        await this.farmService.updateFarmStatus(farmId, FarmStatus.APPROVED, manager);
                        await this.farmCertificateService.updateCertsStatus(farmId, CertificateStatus.APPROVED, manager);
                        break;
                    case ApprovalAction.REJECTED:
                        await this.farmService.updateFarmStatus(farmId, FarmStatus.REJECTED, manager);
                        await this.farmCertificateService.updateCertsStatus(farmId, CertificateStatus.REJECTED, manager);
                        break;
                    default:
                        await this.farmService.updateFarmStatus(farmId, FarmStatus.BLOCKED, manager);
                }

            });
            return true;
        }
        catch (error) {
            this.logger.error("Failed to approve farm");
            throw new InternalServerErrorException({
                message: "Failed to approve farm",
                code: ResponseCode.FAILED_TO_APPROVE_FARM,
            })
        }
    }

    async listFarm(listDto: ListFarmDto): Promise<PaginationResult<FarmListResponseDto>> {
        return await this.farmService.adminListFarm(listDto);
    }

    async getFarmDetail(farmId: number): Promise<AdminFarmDetailDto> {
        return await this.farmService.adminGetFarmById(farmId);
    }

    async getFarmCertificate(farmId: number, getCertDto: GetCertDto): Promise<FarmCertificate[]> {
        return await this.farmCertificateService.getFarmCertificate(farmId, getCertDto);
    }
}
