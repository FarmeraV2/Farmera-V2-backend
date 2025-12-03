import { Body, Controller, Patch } from '@nestjs/common';
import { FarmManagementService } from './farm-management.service';
import { Roles } from 'src/common/decorators/role.decorator';
import { UserRole } from 'src/common/enums/role.enum';
import { ApproveFarmDto } from '../dtos/farm-management/approve-farm.dto';

@Roles([UserRole.ADMIN])
@Controller('farm-management')
export class FarmManagementController {

    constructor(private readonly farmManagementService: FarmManagementService) { }

    @Patch("approve")
    async approveFarm(@Body() approveDto: ApproveFarmDto) {
        return await this.farmManagementService.approveFarm(approveDto.user_id, approveDto.farm_id);
    }
}
