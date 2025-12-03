import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ResponseCode } from 'src/common/constants/response-code.const';
import { UserRole } from 'src/common/enums/role.enum';
import { FarmStatus } from 'src/modules/farm/enums/farm-status.enum';
import { FarmService } from 'src/modules/farm/farm/farm.service';
import { UserService } from 'src/modules/user/user/user.service';
import { DataSource } from 'typeorm';

@Injectable()
export class FarmManagementService {

    private readonly logger = new Logger(FarmManagementService.name);

    constructor(
        private readonly userService: UserService,
        private readonly farmService: FarmService,
        private readonly dataSource: DataSource
    ) { }

    async approveFarm(userId: number, farmId: number): Promise<boolean> {
        try {
            await this.dataSource.transaction(async (manager) => {
                await this.farmService.updateFarmStatus(farmId, FarmStatus.APPROVED, manager);
                await this.userService.updateRole(userId, UserRole.FARMER, manager);
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
