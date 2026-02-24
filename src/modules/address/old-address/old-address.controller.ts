import { Controller, Get, Param, Post } from '@nestjs/common';
import { OldAddressService } from './old-address.service';
import { Public } from 'src/common/decorators/public.decorator';

@Controller({ path: "address", version: "1" })
export class OldAddressController {
    constructor(private readonly addressService: OldAddressService) { }

    @Public()
    @Get('province')
    async getProvinces() {
        return await this.addressService.getProvinces();
    }

    @Public()
    @Get('district/:province_code')
    async getDistrict(@Param('province_code') code: number) {
        return await this.addressService.getDistricts(code);
    }

    @Public()
    @Get('ward/:district_code')
    async getWard(@Param('district_code') code: number) {
        return await this.addressService.getWards(code);
    }

    /**
     * Reset tất cả ghn_code về null cho provinces
     * POST /v1/address/reset/provinces
     */
    @Public()
    @Post('reset/provinces')
    async resetProvinces() {
        return await this.addressService.resetProvincesGhnCode();
    }

    /**
     * Reset tất cả ghn_code về null cho districts
     * POST /v1/address/reset/districts
     */
    @Public()
    @Post('reset/districts')
    async resetDistricts() {
        return await this.addressService.resetDistrictsGhnCode();
    }

    /**
     * Reset tất cả ghn_code về null cho wards
     * POST /v1/address/reset/wards
     */
    @Public()
    @Post('reset/wards')
    async resetWards() {
        return await this.addressService.resetWardsGhnCode();
    }

    /**
     * Reset tất cả ghn_code về null cho toàn bộ địa chỉ
     * POST /v1/address/reset/all
     */
    @Public()
    @Post('reset/all')
    async resetAll() {
        return await this.addressService.resetAllGhnCodes();
    }

    /**
     * Sync tất cả provinces với GHN API
     * GET /v1/address/sync/provinces
     */
    @Public()
    @Post('sync/provinces')
    async syncProvinces() {
        return await this.addressService.syncAllProvincesWithGHN();
    }

    /**
     * Sync tất cả districts với GHN API
     * GET /v1/address/sync/districts
     */
    @Public()
    @Post('sync/districts')
    async syncDistricts() {
        return await this.addressService.syncAllDistrictsWithGHN();
    }

    /**
     * Sync tất cả wards với GHN API
     * GET /v1/address/sync/wards
     */
    @Public()
    @Post('sync/wards')
    async syncWards() {
        return await this.addressService.syncAllWardsWithGHN();
    }

    /**
     * Sync toàn bộ địa chỉ (provinces, districts, wards) với GHN API
     * GET /v1/address/sync/all
     */
    @Public()
    @Post('sync/all')
    async syncAll() {
        return await this.addressService.syncAllAddressesWithGHN();
    }

    /**
     * Sync districts cho một province cụ thể
     * GET /v1/address/sync/province/:province_code/districts
     */
    @Public()
    @Post('sync/province/:province_code/districts')
    async syncDistrictsForProvince(@Param('province_code') provinceCode: number) {
        return await this.addressService.syncDistrictsForProvince(provinceCode);
    }

    /**
     * Sync wards cho một district cụ thể
     * GET /v1/address/sync/district/:district_code/wards
     */
    @Public()
    @Post('sync/district/:district_code/wards')
    async syncWardsForDistrict(@Param('district_code') districtCode: number) {
        return await this.addressService.syncWardsForDistrict(districtCode);
    }
}

