import { HttpService } from "@nestjs/axios";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";
import axios from "axios";
import { GhnApiResponse, GhnDistrict, GhnProvince, GhnWard } from "../dtos/ghn.request.dto";

@Injectable()
export class GHNService {
    private readonly logger = new Logger(GHNService.name);
    private ghnToken: string;
    private ghnShopId: number;
    private ghnUrlGetProvince: string;
    private ghnUrlGetDistrict: string;
    private ghnUrlGetWard: string;
    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,

    ) {
        const GHN_TOKEN = this.configService.get<string>('GHN_TOKEN');
        const GHN_SHOP_ID = this.configService.get<number>('GHN_SHOP_ID');
        const GHN_URL_GET_PROVINCE = this.configService.get<string>('GHN_GET_PROVINCE_URL');
        const GHN_URL_GET_DISTRICT = this.configService.get<string>('GHN_GET_DISTRICT_URL');
        const GHN_URL_GET_WARD = this.configService.get<string>('GHN_GET_WARD_URL');
        if (!GHN_TOKEN || !GHN_SHOP_ID || !GHN_URL_GET_PROVINCE || !GHN_URL_GET_DISTRICT || !GHN_URL_GET_WARD) {
            throw new Error('Missing GHN configuration');
        }
        this.ghnToken = GHN_TOKEN;
        this.ghnShopId = GHN_SHOP_ID;
        this.ghnUrlGetProvince = GHN_URL_GET_PROVINCE;
        this.ghnUrlGetDistrict = GHN_URL_GET_DISTRICT;
        this.ghnUrlGetWard = GHN_URL_GET_WARD;
    }
    
    
    
    
    
    private normalizeUserInputLocationName(name: string, prefixes: string[] = []): string {
        if (!name) return '';
        let normalized = name.toLowerCase();

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
        if (!normalized) return '';

        const words = normalized.split(' ');
        const capitalizedWords = words.map(word => {
            if (word.length === 0) return '';
            return word.charAt(0).toUpperCase() + word.substring(1);
        });
        // Log tên gốc và tên đã chuẩn hóa để debug
        // this.logger.debug(`Normalized user input: "${name}" to "${capitalizedWords.join(' ')}"`);
        return capitalizedWords.join(' ');
    }

    /**
     * Chỉ chuyển chuỗi sang chữ thường và xóa khoảng trắng thừa ở hai đầu.
     */
    private simplifyApiName(name?: string): string {
        if (!name) return '';
        return name.toLowerCase().trim();
    }


    async getIdProvince(provinceNameInput: string): Promise<number | null> {
        if (!provinceNameInput || provinceNameInput.trim() === '') {
            this.logger.warn('getIdProvince called with empty input name.');
            return null;
        }

        const headers = { 'Token': this.ghnToken };
        this.logger.log(`Fetching GHN provinces for input: "${provinceNameInput}"`);

        // Chỉ chuẩn hóa đầu vào của người dùng MỘT LẦN
        const normalizedUserInput = this.normalizeUserInputLocationName(provinceNameInput, ["tỉnh", "thành phố", "tp"]);
        this.logger.debug(`Normalized user input for province: "${normalizedUserInput}"`);

        try {
            const response = await firstValueFrom(
                this.httpService.get<GhnApiResponse<GhnProvince[]>>(this.ghnUrlGetProvince, { headers })
            );

            if (response.data && response.data.code === 200 && Array.isArray(response.data.data)) {
                const provinces: GhnProvince[] = response.data.data;

                for (const province of provinces) {
                    // So sánh với ProvinceName của API (chỉ chuyển sang chữ thường và trim)
                    if (this.simplifyApiName(province.ProvinceName) === this.simplifyApiName(normalizedUserInput)) {
                        this.logger.log(`Match for "${provinceNameInput}" (normalized: "${normalizedUserInput}") with API ProvinceName "${province.ProvinceName}". ID: ${province.ProvinceID}`);
                        return province.ProvinceID;
                    }
                    // So sánh với NameExtension của API (chỉ chuyển sang chữ thường và trim)
                    if (province.NameExtension?.some(ext => this.simplifyApiName(ext) === this.simplifyApiName(normalizedUserInput))) {
                        this.logger.log(`Match for "${provinceNameInput}" (normalized: "${normalizedUserInput}") with API NameExtension. ID: ${province.ProvinceID}`);
                        return province.ProvinceID;
                    }
                }
                this.logger.warn(`Province ID not found for: "${provinceNameInput}" (normalized user input: "${normalizedUserInput}")`);
                return null;
            } else {
                this.logger.error(`GHN GetProvinces API error. Code: ${response.data?.code}, Msg: ${response.data?.message}`);
                throw new Error('GHN API returned an error or unexpected data for provinces.');
            }
        } catch (error) {
            this.logger.error(`Error fetching GHN provinces for "${provinceNameInput}": ${error.message}`, error.stack);
            if (axios.isAxiosError(error) && error.response) {
                this.logger.error('Axios error details:', { status: error.response.status, data: error.response.data });
            }
            throw new Error(`Failed to communicate with GHN API for provinces: ${error.message}`);
        }
    }

    async getIdDistrict(districtNameInput: string, provinceId: number): Promise<number | null> {
        if (!districtNameInput || districtNameInput.trim() === '') {
            this.logger.warn('getIdDistrict called with empty input name.');
            return null;
        }
        if (!provinceId) {
            this.logger.warn('getIdDistrict called with invalid provinceId.');
            return null;
        }

        const headers = {
            'Token': this.ghnToken,
            'Content-Type': 'application/json',
        };
        const payload = { province_id: provinceId };
        this.logger.log(`Fetching GHN districts for input: "${districtNameInput}" in province ID: ${provinceId}`);

        const districtPrefixes = ["quận", "huyện", "thị xã", "thành phố", "q.", "tx."];
        // Chỉ chuẩn hóa đầu vào của người dùng MỘT LẦN
        const normalizedUserInput = this.normalizeUserInputLocationName(districtNameInput, districtPrefixes);
        this.logger.debug(`Normalized user input for district: "${normalizedUserInput}"`);

        try {
            const response = await firstValueFrom(
                this.httpService.post<GhnApiResponse<GhnDistrict[]>>(this.ghnUrlGetDistrict, payload, { headers })
            );

            if (response.data && response.data.code === 200 && Array.isArray(response.data.data)) {
                const districts: GhnDistrict[] = response.data.data;

                for (const district of districts) {
                    // So sánh với DistrictName của API (chỉ chuyển sang chữ thường và trim)
                    if (this.simplifyApiName(district.DistrictName) === this.simplifyApiName(normalizedUserInput)) {
                        this.logger.log(`Match for "${districtNameInput}" (normalized: "${normalizedUserInput}") with API DistrictName "${district.DistrictName}". ID: ${district.DistrictID}`);
                        return district.DistrictID;
                    }
                    // So sánh với NameExtension của API (chỉ chuyển sang chữ thường và trim)
                    if (district.NameExtension?.some(ext => this.simplifyApiName(ext) === this.simplifyApiName(normalizedUserInput))) {
                        this.logger.log(`Match for "${districtNameInput}" (normalized: "${normalizedUserInput}") with API NameExtension. ID: ${district.DistrictID}`);
                        return district.DistrictID;
                    }
                }
                this.logger.warn(`District ID not found for: "${districtNameInput}" (normalized user input: "${normalizedUserInput}") in province ${provinceId}`);
                return null;
            } else {
                this.logger.error(`GHN GetDistricts API error. Code: ${response.data?.code}, Msg: ${response.data?.message}`, response.data);
                throw new Error(`GHN API returned an error or unexpected data for districts in province ${provinceId}.`);
            }
        } catch (error) {
            this.logger.error(`Error fetching GHN districts for "${districtNameInput}" (province ${provinceId}): ${error.message}`, error.stack);
            if (axios.isAxiosError(error) && error.response) {
                this.logger.error('Axios error details:', { status: error.response.status, data: error.response.data });
            }
            throw new Error(`Failed to communicate with GHN API for districts: ${error.message}`);
        }
    }

    async getIdWard(wardNameInput: string, districtId: number): Promise<string | null> {
        if (!wardNameInput || wardNameInput.trim() === '') {
            this.logger.warn('getIdWard called with empty input name.');
            return null;
        }
        if (!districtId) {
            this.logger.warn('getIdWard called with invalid districtId.');
            return null;
        }

        const headers = {
            'Token': this.ghnToken,
            'Content-Type': 'application/json',
        };
        const payload = { district_id: districtId };
        this.logger.log(`Fetching GHN wards for input: "${wardNameInput}" in district ID: ${districtId}`);

        const wardPrefixes = ["phường", "xã", "thị trấn", "p."];
        // Chỉ chuẩn hóa đầu vào của người dùng MỘT LẦN
        const normalizedUserInput = this.normalizeUserInputLocationName(wardNameInput, wardPrefixes);
        this.logger.debug(`Normalized user input for ward: "${normalizedUserInput}"`);

        try {
            const response = await firstValueFrom(
                this.httpService.post<GhnApiResponse<GhnWard[]>>(this.ghnUrlGetWard, payload, { headers })
            );

            if (response.data && response.data.code === 200 && Array.isArray(response.data.data)) {
                const wards: GhnWard[] = response.data.data;

                for (const ward of wards) {
                    // So sánh với WardName của API (chỉ chuyển sang chữ thường và trim)
                    if (this.simplifyApiName(ward.WardName) === this.simplifyApiName(normalizedUserInput)) {
                        this.logger.log(`Match for "${wardNameInput}" (normalized: "${normalizedUserInput}") with API WardName "${ward.WardName}". Code: ${ward.WardCode}`);
                        return ward.WardCode;
                    }
                    // So sánh với NameExtension của API (chỉ chuyển sang chữ thường và trim)
                    if (ward.NameExtension?.some(ext => this.simplifyApiName(ext) === this.simplifyApiName(normalizedUserInput))) {
                        this.logger.log(`Match for "${wardNameInput}" (normalized: "${normalizedUserInput}") with API NameExtension. Code: ${ward.WardCode}`);
                        return ward.WardCode;
                    }
                }
                this.logger.warn(`Ward Code not found for: "${wardNameInput}" (normalized user input: "${normalizedUserInput}") in district ${districtId}`);
                return null;
            } else {
                this.logger.error(`GHN GetWards API error. Code: ${response.data?.code}, Msg: ${response.data?.message}`, response.data);
                throw new Error(`GHN API returned an error or unexpected data for wards in district ${districtId}.`);
            }
        } catch (error) {
            this.logger.error(`Error fetching GHN wards for "${wardNameInput}" (district ${districtId}): ${error.message}`, error.stack);
            if (axios.isAxiosError(error) && error.response) {
                this.logger.error('Axios error details:', { status: error.response.status, data: error.response.data });
            }
            throw new Error(`Failed to communicate with GHN API for wards: ${error.message}`);
        }
    }
}