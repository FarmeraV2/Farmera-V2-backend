import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { FarmManagementService } from './farm-management.service';
import { Roles } from 'src/common/decorators/role.decorator';
import { UserRole } from 'src/common/enums/role.enum';
import { CreateApprovalDto } from 'src/modules/farm/dtos/approval/create-approval.dto';
import { User } from 'src/common/decorators/user.decorator';
import { UserInterface } from 'src/common/types/user.interface';
import { ListFarmDto } from 'src/modules/farm/dtos/farm/list-farm.dto';
import { GetCertDto } from 'src/modules/farm/dtos/farm-cert/get-cert.dto';

@Roles([UserRole.ADMIN])
@Controller('farm-management')
export class FarmManagementController {

    constructor(private readonly farmManagementService: FarmManagementService) { }

    @Post("approve")
    async approveFarm(@User() user: UserInterface, @Body() createApprovalDto: CreateApprovalDto) {
        return await this.farmManagementService.createApproval(user.id, createApprovalDto.farm_id, createApprovalDto);
    }

    @Get()
    async listFarms(@Query() listFarmDto: ListFarmDto) {
        return await this.farmManagementService.listFarm(listFarmDto);
    }

    @Get(":id/certificate")
    async getFarmCertificate(@Param("id") farmId: number, @Query() getCertDto: GetCertDto) {
        return await this.farmManagementService.getFarmCertificate(farmId, getCertDto);
    }

    @Get(":id")
    async getFarmDetail(@Param("id") farmId: number) {
        return await this.farmManagementService.getFarmDetail(farmId);
    }
}
