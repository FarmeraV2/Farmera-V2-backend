import { Controller, Get, Param } from '@nestjs/common';
import { FarmApprovalService } from './farm-approval.service';
import { Roles } from 'src/common/decorators/role.decorator';
import { UserRole } from 'src/common/enums/role.enum';

@Roles([UserRole.ADMIN, UserRole.FARMER])
@Controller('farm-approval')
export class FarmApprovalController {

    constructor(private readonly farmApprovalService: FarmApprovalService) { }

    @Get(":farmId")
    async getFarmApproval(@Param("farmId") farmId: number) {
        return await this.farmApprovalService.getFarmApprovals(farmId);
    }
}
