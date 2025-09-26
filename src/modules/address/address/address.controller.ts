import { Controller, Get, Param } from '@nestjs/common';
import { AddressService } from './address.service';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('address')
export class AddressController {

    constructor(private readonly addressService: AddressService) { }

    @Public()
    @Get("province")
    async getProvinces() {
        return await this.addressService.getAllProvinces();
    }

    @Public()
    @Get("ward/:province_code")
    async getWard(@Param("province_code") code: number) {
        return await this.addressService.getWardByProvinceCode(code);
    }
}
