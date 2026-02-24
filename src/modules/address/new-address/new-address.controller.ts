import { Controller, Get, Param } from '@nestjs/common';
import { NewAddressService } from './new-address.service';
import { Public } from 'src/common/decorators/public.decorator';

@Controller({ path: "address", version: "2" })
export class NewAddressController {
    constructor(private readonly addressService: NewAddressService) { }

    @Public()
    @Get('province')
    async getProvinces() {
        return await this.addressService.getProvinces();
    }

    @Public()
    @Get('ward/:province_code')
    async getWard(@Param('province_code') code: number) {
        return await this.addressService.getWards(code);
    }
}
