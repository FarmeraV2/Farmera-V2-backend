import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { FarmCertificateService } from './farm-certificate.service';
import { UserRole } from 'src/common/enums/role.enum';
import { Roles } from 'src/common/decorators/role.decorator';
import { AddCertsDto } from '../dtos/farm-cert/add-farm-cert.dto';
import { User } from 'src/common/decorators/user.decorator';
import { UserInterface } from 'src/common/types/user.interface';
import { Public } from 'src/common/decorators/public.decorator';
import { GetCertDto } from '../dtos/farm-cert/get-cert.dto';

@Controller('certificate')
export class FarmCertificateController {

    constructor(private readonly farmCertificateService: FarmCertificateService) { }

    @Post()
    @Roles([UserRole.FARMER])
    async addCertificate(@Body() certDto: AddCertsDto, @User() user: UserInterface) {
        return await this.farmCertificateService.addCertificates(user.farm_id!, certDto.certificates);
    }

    @Public()
    @Get("farm/:farmId")
    async getFarmCertificate(@Param("farmId") farmId: number, @Query() getCertDto: GetCertDto) {
        return await this.farmCertificateService.getFarmCertificate(farmId, getCertDto);
    }
}
