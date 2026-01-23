import { HttpException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OldProvince } from '../entities/old-province.entity';
import { OldDistrict } from '../entities/old-district.entity';
import { OldWard } from '../entities/old-ward.entity';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { ResponseCode } from 'src/common/constants/response-code.const';
import { AddressService } from '../interfaces/address.interface';
import { forwardRef, Inject } from '@nestjs/common';

@Injectable()
export class OldAddressService implements AddressService {

    private readonly logger = new Logger(OldAddressService.name);
    private addressApi: string | undefined;

    private ghnService: any;

    constructor(
        @InjectRepository(OldProvince) private readonly oldProvinceRepository: Repository<OldProvince>,
        @InjectRepository(OldDistrict) private readonly oldDistrictRepository: Repository<OldDistrict>,
        @InjectRepository(OldWard) private readonly oldWardRepository: Repository<OldWard>,
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {
        const addressApi = this.configService.get<string>("OLD_ADDRESS_API_ENDPOINT");
        if (!addressApi) {
            this.logger.warn('External old address api endpoint not found, pulling old address process will be disable');
            return;
        }
        this.addressApi = addressApi;
    }

    setGhnService(ghnService: any) {
        this.ghnService = ghnService;
    }

    async onApplicationBootstrap() {
        // await this.importAddresses();
    }

    private async importAddresses() {
        const count = await this.oldProvinceRepository.count();
        if (count > 0) {
            this.logger.log("Already have old address data, pulling will be skipped")
            return;
        }
        if (!this.addressApi) {
            this.logger.error('External old address api is not configured');
            return;
        }
        try {
            const response = await firstValueFrom(this.httpService.get(`${this.addressApi}?depth=3`));
            const provinces: OldProvince[] = response.data.map((province: OldProvince) => this.oldProvinceRepository.create(province));
            await this.oldProvinceRepository.save(provinces);
        }
        catch (error) {
            this.logger.error(error.message);
            return;
        }
    }

    async getProvinces(): Promise<OldProvince[]> {
        try {
            return await this.oldProvinceRepository.find();
        }
        catch (error) {
            if (error instanceof HttpException) throw error;
            this.logger.error(error.message);
            throw new InternalServerErrorException({
                message: "Failed to get provinces",
                code: ResponseCode.FAILED_TO_GET_PROVINCES,
            });
        }
    }

    async getDistricts(code: number): Promise<OldDistrict[]> {
        try {
            return await this.oldDistrictRepository.find({ where: { province_code: code } });
        }
        catch (error) {
            if (error instanceof HttpException) throw error;
            this.logger.error(error.message);
            throw new InternalServerErrorException({
                message: "Failed to get districts",
                code: ResponseCode.FAILED_TO_GET_DISTRICTS
            });
        }
    }

    async getWards(code: number): Promise<OldWard[]> {
        try {
            return await this.oldWardRepository.find({ where: { district_code: code } });
        }
        catch (error) {
            if (error instanceof HttpException) throw error;
            this.logger.error(error.message);
            throw new InternalServerErrorException({
                message: "Failed to get wards",
                code: ResponseCode.FAILED_TO_GET_WARDS
            });
        }
    }

    /**
     * Tìm province theo tên (có thể có hoặc không có prefix)
     */
    async findProvinceByName(name: string): Promise<OldProvince | null> {
        try {
            const normalizedName = this.normalizeLocationName(name, ['tỉnh', 'thành phố', 'tp']);
            
            const provinces = await this.oldProvinceRepository.find();
            
            for (const province of provinces) {
                const provinceNormalizedName = this.normalizeLocationName(province.name, ['tỉnh', 'thành phố', 'tp']);
                if (provinceNormalizedName.toLowerCase() === normalizedName.toLowerCase()) {
                    return province;
                }
            }
            
            return null;
        }
        catch (error) {
            this.logger.error(`Error finding province by name: ${error.message}`);
            return null;
        }
    }

    /**
     * Tìm district theo tên và province_code
     */
    async findDistrictByName(name: string, provinceCode: number): Promise<OldDistrict | null> {
        try {
            const normalizedName = this.normalizeLocationName(name, ['quận', 'huyện', 'thị xã', 'thành phố', 'q.', 'tx.']);
            
            const districts = await this.oldDistrictRepository.find({ where: { province_code: provinceCode } });
            
            for (const district of districts) {
                const districtNormalizedName = this.normalizeLocationName(district.name, ['quận', 'huyện', 'thị xã', 'thành phố', 'q.', 'tx.']);
                if (districtNormalizedName.toLowerCase() === normalizedName.toLowerCase()) {
                    return district;
                }
            }
            
            return null;
        }
        catch (error) {
            this.logger.error(`Error finding district by name: ${error.message}`);
            return null;
        }
    }

    /**
     * Tìm ward theo tên và district_code
     */
    async findWardByName(name: string, districtCode: number): Promise<OldWard | null> {
        try {
            const normalizedName = this.normalizeLocationName(name, ['phường', 'xã', 'thị trấn', 'p.']);
            
            const wards = await this.oldWardRepository.find({ where: { district_code: districtCode } });
            
            for (const ward of wards) {
                const wardNormalizedName = this.normalizeLocationName(ward.name, ['phường', 'xã', 'thị trấn', 'p.']);
                if (wardNormalizedName.toLowerCase() === normalizedName.toLowerCase()) {
                    return ward;
                }
            }
            
            return null;
        }
        catch (error) {
            this.logger.error(`Error finding ward by name: ${error.message}`);
            return null;
        }
    }

    /**
     * Chuẩn hóa tên địa điểm bằng cách loại bỏ prefix và capitalize
     */
    private normalizeLocationName(name: string, prefixes: string[] = []): string {
        if (!name) return '';
        let normalized = name.toLowerCase().trim();

        for (const prefix of prefixes) {
            const lowerPrefix = prefix.toLowerCase();
            if (normalized.startsWith(lowerPrefix + ' ')) {
                normalized = normalized.substring(lowerPrefix.length + 1);
                break;
            }
            if (normalized.startsWith(lowerPrefix)) {
                const potentialNextChar = normalized.charAt(lowerPrefix.length);
                if (potentialNextChar === '.' || potentialNextChar === ' ' || potentialNextChar === '') {
                    normalized = normalized.substring(lowerPrefix.length).trimStart().replace(/^\./, '').trimStart();
                    break;
                }
            }
        }

        normalized = normalized.replace(/\s+/g, ' ').trim();
        return normalized;
    }

    /**
     * Cập nhật ghn_code cho province
     */
    async updateProvinceGhnCode(code: number, ghnCode: number): Promise<void> {
        try {
            await this.oldProvinceRepository.update({ code }, { ghn_code: ghnCode.toString() });
            this.logger.log(`Updated province ${code} with GHN code ${ghnCode}`);
        }
        catch (error) {
            this.logger.error(`Failed to update province GHN code: ${error.message}`);
        }
    }

    /**
     * Cập nhật ghn_code cho district
     */
    async updateDistrictGhnCode(code: number, ghnCode: number): Promise<void> {
        try {
            await this.oldDistrictRepository.update({ code }, { ghn_code: ghnCode.toString() });
            this.logger.log(`Updated district ${code} with GHN code ${ghnCode}`);
        }
        catch (error) {
            this.logger.error(`Failed to update district GHN code: ${error.message}`);
        }
    }

    /**
     * Cập nhật ghn_code cho ward
     */
    async updateWardGhnCode(code: number, ghnCode: string): Promise<void> {
        try {
            await this.oldWardRepository.update({ code }, { ghn_code: ghnCode });
            this.logger.log(`Updated ward ${code} with GHN code ${ghnCode}`);
        }
        catch (error) {
            this.logger.error(`Failed to update ward GHN code: ${error.message}`);
        }
    }

    /**
     * Đồng bộ tất cả provinces với GHN API
     */
    async syncAllProvincesWithGHN(): Promise<{ success: number; failed: number; total: number }> {
        if (!this.ghnService) {
            throw new Error('GHN Service not initialized');
        }

        const provinces = await this.oldProvinceRepository.find();
        let success = 0;
        let failed = 0;

        this.logger.log(`Starting sync for ${provinces.length} provinces...`);

        for (const province of provinces) {
            try {
                this.logger.log(`Syncing province: ${province.name} (code: ${province.code})`);
                const ghnProvinceId = await this.ghnService.getIdProvince(province.name);
                
                if (ghnProvinceId) {
                    await this.updateProvinceGhnCode(province.code, ghnProvinceId);
                    success++;
                    this.logger.log(`✓ Synced province ${province.name} -> GHN ID: ${ghnProvinceId}`);
                } else {
                    failed++;
                    this.logger.warn(`✗ Could not find GHN ID for province: ${province.name}`);
                }
            } catch (error) {
                failed++;
                this.logger.error(`✗ Failed to sync province ${province.name}: ${error.message}`);
            }
        }

        this.logger.log(`Sync completed: ${success} success, ${failed} failed out of ${provinces.length} total`);
        return { success, failed, total: provinces.length };
    }

    /**
     * Đồng bộ tất cả districts của một province với GHN API
     */
    async syncDistrictsForProvince(provinceCode: number): Promise<{ success: number; failed: number; total: number }> {
        if (!this.ghnService) {
            throw new Error('GHN Service not initialized');
        }

        const province = await this.oldProvinceRepository.findOne({ where: { code: provinceCode } });
        if (!province) {
            throw new Error(`Province with code ${provinceCode} not found`);
        }

        if (!province.ghn_code) {
            throw new Error(`Province ${province.name} does not have GHN code. Please sync provinces first.`);
        }

        const districts = await this.oldDistrictRepository.find({ where: { province_code: provinceCode } });
        let success = 0;
        let failed = 0;

        this.logger.log(`Starting sync for ${districts.length} districts in province ${province.name}...`);

        for (const district of districts) {
            try {
                this.logger.log(`Syncing district: ${district.name} (code: ${district.code})`);
                const ghnDistrictId = await this.ghnService.getIdDistrict(district.name, parseInt(province.ghn_code));
                
                if (ghnDistrictId) {
                    await this.updateDistrictGhnCode(district.code, ghnDistrictId);
                    success++;
                    this.logger.log(`✓ Synced district ${district.name} -> GHN ID: ${ghnDistrictId}`);
                } else {
                    failed++;
                    this.logger.warn(`✗ Could not find GHN ID for district: ${district.name}`);
                }
            } catch (error) {
                failed++;
                this.logger.error(`✗ Failed to sync district ${district.name}: ${error.message}`);
            }
        }

        this.logger.log(`Sync completed for province ${province.name}: ${success} success, ${failed} failed out of ${districts.length} total`);
        return { success, failed, total: districts.length };
    }

    /**
     * Đồng bộ tất cả districts cho tất cả provinces
     */
    async syncAllDistrictsWithGHN(): Promise<{ success: number; failed: number; total: number }> {
        const provinces = await this.oldProvinceRepository.find();
        let totalSuccess = 0;
        let totalFailed = 0;
        let totalDistricts = 0;

        for (const province of provinces) {
            if (province.ghn_code) {
                try {
                    const result = await this.syncDistrictsForProvince(province.code);
                    totalSuccess += result.success;
                    totalFailed += result.failed;
                    totalDistricts += result.total;
                } catch (error) {
                    this.logger.error(`Failed to sync districts for province ${province.name}: ${error.message}`);
                }
            } else {
                this.logger.warn(`Skipping province ${province.name} - no GHN code`);
            }
        }

        this.logger.log(`Total districts sync: ${totalSuccess} success, ${totalFailed} failed out of ${totalDistricts} total`);
        return { success: totalSuccess, failed: totalFailed, total: totalDistricts };
    }

    /**
     * Đồng bộ tất cả wards của một district với GHN API
     */
    async syncWardsForDistrict(districtCode: number): Promise<{ success: number; failed: number; total: number }> {
        if (!this.ghnService) {
            throw new Error('GHN Service not initialized');
        }

        const district = await this.oldDistrictRepository.findOne({ where: { code: districtCode }, relations: ['province'] });
        if (!district) {
            throw new Error(`District with code ${districtCode} not found`);
        }

        if (!district.ghn_code) {
            throw new Error(`District ${district.name} does not have GHN code. Please sync districts first.`);
        }

        const wards = await this.oldWardRepository.find({ where: { district_code: districtCode } });
        let success = 0;
        let failed = 0;

        this.logger.log(`Starting sync for ${wards.length} wards in district ${district.name}...`);

        for (const ward of wards) {
            try {
                this.logger.log(`Syncing ward: ${ward.name} (code: ${ward.code})`);
                const ghnWardCode = await this.ghnService.getIdWard(ward.name, parseInt(district.ghn_code));
                
                if (ghnWardCode) {
                    await this.updateWardGhnCode(ward.code, ghnWardCode);
                    success++;
                    this.logger.log(`✓ Synced ward ${ward.name} -> GHN Code: ${ghnWardCode}`);
                } else {
                    failed++;
                    this.logger.warn(`✗ Could not find GHN code for ward: ${ward.name}`);
                }
            } catch (error) {
                failed++;
                this.logger.error(`✗ Failed to sync ward ${ward.name}: ${error.message}`);
            }
        }

        this.logger.log(`Sync completed for district ${district.name}: ${success} success, ${failed} failed out of ${wards.length} total`);
        return { success, failed, total: wards.length };
    }

    /**
     * Đồng bộ tất cả wards cho tất cả districts
     */
    async syncAllWardsWithGHN(): Promise<{ success: number; failed: number; total: number }> {
        const districts = await this.oldDistrictRepository.find();
        let totalSuccess = 0;
        let totalFailed = 0;
        let totalWards = 0;

        for (const district of districts) {
            if (district.ghn_code) {
                try {
                    const result = await this.syncWardsForDistrict(district.code);
                    totalSuccess += result.success;
                    totalFailed += result.failed;
                    totalWards += result.total;
                } catch (error) {
                    this.logger.error(`Failed to sync wards for district ${district.name}: ${error.message}`);
                }
            } else {
                this.logger.warn(`Skipping district ${district.name} - no GHN code`);
            }
        }

        this.logger.log(`Total wards sync: ${totalSuccess} success, ${totalFailed} failed out of ${totalWards} total`);
        return { success: totalSuccess, failed: totalFailed, total: totalWards };
    }

    /**
     * Reset tất cả ghn_code về null cho provinces
     */
    async resetProvincesGhnCode(): Promise<{ affected: number }> {
        try {
            const result = await this.oldProvinceRepository
                .createQueryBuilder()
                .update(OldProvince)
                .set({ ghn_code: null as any })
                .execute();
            this.logger.log(`Reset ghn_code for ${result.affected} provinces`);
            return { affected: result.affected || 0 };
        } catch (error) {
            this.logger.error(`Failed to reset provinces ghn_code: ${error.message}`);
            throw error;
        }
    }

    /**
     * Reset tất cả ghn_code về null cho districts
     */
    async resetDistrictsGhnCode(): Promise<{ affected: number }> {
        try {
            const result = await this.oldDistrictRepository
                .createQueryBuilder()
                .update(OldDistrict)
                .set({ ghn_code: null as any })
                .execute();
            this.logger.log(`Reset ghn_code for ${result.affected} districts`);
            return { affected: result.affected || 0 };
        } catch (error) {
            this.logger.error(`Failed to reset districts ghn_code: ${error.message}`);
            throw error;
        }
    }

    /**
     * Reset tất cả ghn_code về null cho wards
     */
    async resetWardsGhnCode(): Promise<{ affected: number }> {
        try {
            const result = await this.oldWardRepository
                .createQueryBuilder()
                .update(OldWard)
                .set({ ghn_code: null as any })
                .execute();
            this.logger.log(`Reset ghn_code for ${result.affected} wards`);
            return { affected: result.affected || 0 };
        } catch (error) {
            this.logger.error(`Failed to reset wards ghn_code: ${error.message}`);
            throw error;
        }
    }

    /**
     * Reset tất cả ghn_code về null cho toàn bộ địa chỉ
     */
    async resetAllGhnCodes(): Promise<any> {
        this.logger.log('=== Resetting all ghn_codes to null ===');
        
        const provinceResult = await this.resetProvincesGhnCode();
        const districtResult = await this.resetDistrictsGhnCode();
        const wardResult = await this.resetWardsGhnCode();
        
        const result = {
            provinces: provinceResult,
            districts: districtResult,
            wards: wardResult,
            total: provinceResult.affected + districtResult.affected + wardResult.affected
        };

        this.logger.log('=== Reset completed ===');
        this.logger.log(JSON.stringify(result, null, 2));
        
        return result;
    }

    /**
     * Đồng bộ toàn bộ địa chỉ (provinces, districts, wards) với GHN API
     */
    async syncAllAddressesWithGHN(): Promise<any> {
        this.logger.log('=== Starting full address sync with GHN API ===');
        
        // Bước 1: Sync provinces
        this.logger.log('\n[STEP 1] Syncing provinces...');
        const provinceResult = await this.syncAllProvincesWithGHN();
        
        // Bước 2: Sync districts
        this.logger.log('\n[STEP 2] Syncing districts...');
        const districtResult = await this.syncAllDistrictsWithGHN();
        
        // Bước 3: Sync wards
        this.logger.log('\n[STEP 3] Syncing wards...');
        const wardResult = await this.syncAllWardsWithGHN();
        
        const result = {
            provinces: provinceResult,
            districts: districtResult,
            wards: wardResult,
            summary: {
                totalSuccess: provinceResult.success + districtResult.success + wardResult.success,
                totalFailed: provinceResult.failed + districtResult.failed + wardResult.failed,
                totalItems: provinceResult.total + districtResult.total + wardResult.total
            }
        };

        this.logger.log('\n=== Full sync completed ===');
        this.logger.log(JSON.stringify(result, null, 2));
        
        return result;
    }
    
}
