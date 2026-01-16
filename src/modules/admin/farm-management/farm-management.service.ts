import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ResponseCode } from 'src/common/constants/response-code.const';
import { UserRole } from 'src/common/enums/role.enum';
import { CreateApprovalDto } from 'src/modules/farm/dtos/approval/create-approval.dto';
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

}
