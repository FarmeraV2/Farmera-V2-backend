import { Controller, Get, Param } from '@nestjs/common';
import { OldAddressService } from './old-address.service';
import { Public } from 'src/common/decorators/public.decorator';

@Controller({ path: "address", version: "1" })
export class OldAddressController {
    constructor(private readonly addressService: OldAddressService) { }

    @Public()
    @Get('province')
    async getProvinces() {
        return await this.addressService.getAllProvinces();
    }

    @Public()
    @Get('district/:province_code')
    async getDistrict(@Param('province_code') code: number) {
        return await this.addressService.getDistrictsByProvince(code);
    }

    @Public()
    @Get('ward/:district_code')
    async getWard(@Param('district_code') code: number) {
        return await this.addressService.getWardsByDistrict(code);
    }
}
