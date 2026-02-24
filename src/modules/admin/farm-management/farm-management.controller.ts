import { Body, Controller, Patch, Post } from '@nestjs/common';
import { FarmManagementService } from './farm-management.service';
import { Roles } from 'src/common/decorators/role.decorator';
import { UserRole } from 'src/common/enums/role.enum';
import { CreateApprovalDto } from 'src/modules/farm/dtos/approval/create-approval.dto';
import { User } from 'src/common/decorators/user.decorator';
import { UserInterface } from 'src/common/types/user.interface';

// @Roles([UserRole.ADMIN])
@Controller('farm-management')
export class FarmManagementController {

    constructor(private readonly farmManagementService: FarmManagementService) { }

    @Post("approve")
    async approveFarm(@User() user: UserInterface, @Body() createApprovalDto: CreateApprovalDto) {
        return await this.farmManagementService.createApproval(user.id, createApprovalDto.farm_id, createApprovalDto);
    }
}
