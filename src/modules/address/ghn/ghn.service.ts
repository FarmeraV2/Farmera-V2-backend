import { HttpService } from "@nestjs/axios";
import { BadRequestException, HttpException, Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { catchError, firstValueFrom, map } from "rxjs";
import axios, { AxiosError } from "axios";
import { GhnApiResponse, GhnDistrict, GhnProvince, GhnWard } from "../dtos/ghn.request.dto";
import { CalculateShippingFeeDto } from "../dtos/calculate-shipping-fee.dto";
import { GhnFeeData, GhnFeeResponseDto } from "../dtos/ghn-fee-response.dto";
import { GhnServiceTypeId } from "../enums/ghn.enum";
import { CreateGhnOrderDto } from "../dtos/ghn-create-delivery.dto";
import { GhnCreatedOrderDataDto, GhnCreateOrderResponseDto } from "../dtos/ghn-order-response.dto";
import { OldAddressService } from "../old-address/old-address.service";


@Injectable()
export class GHNService {
    private readonly logger = new Logger(GHNService.name);
    private ghnToken: string;
    private ghnShopId: number;
    private ghnUrlGetProvince: string;
    private ghnUrlGetDistrict: string;
    private ghnUrlGetWard: string;
    private ghnUrlCalculateDeliveryFee: string;
    private ghnUrlCreateOrder: string;
    private ghnUrlCancelOrder: string;
    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
        private readonly oldAddressService: OldAddressService,
    ) {
        const GHN_TOKEN = this.configService.get<string>('GHN_TOKEN');
        const GHN_SHOP_ID = this.configService.get<number>('GHN_SHOP_ID');
        const GHN_URL_GET_PROVINCE = this.configService.get<string>('GHN_GET_PROVINCE_URL');
        const GHN_URL_GET_DISTRICT = this.configService.get<string>('GHN_GET_DISTRICT_URL');
        const GHN_URL_GET_WARD = this.configService.get<string>('GHN_GET_WARD_URL');
        const GHN_URL_CALCULATE_DELIVERY_FEE = this.configService.get<string>('GHN_CALCULATE_DELIVERY_FEE_URL');
        const GHN_URL_CREATE_ORDER = this.configService.get<string>('GHN_CREATE_ORDER_URL');
        const GHN_URL_CANCEL_ORDER = this.configService.get<string>('GHN_CANCEL_ORDER_URL');
        if (!GHN_TOKEN || !GHN_SHOP_ID || !GHN_URL_GET_PROVINCE || !GHN_URL_GET_DISTRICT || !GHN_URL_GET_WARD || !GHN_URL_CALCULATE_DELIVERY_FEE || !GHN_URL_CREATE_ORDER || !GHN_URL_CANCEL_ORDER) {
            throw new Error('Missing GHN configuration');
        }
        this.ghnToken = GHN_TOKEN;
        this.ghnShopId = GHN_SHOP_ID;
        this.ghnUrlGetProvince = GHN_URL_GET_PROVINCE;
        this.ghnUrlGetDistrict = GHN_URL_GET_DISTRICT;
        this.ghnUrlGetWard = GHN_URL_GET_WARD;
        this.ghnUrlCalculateDeliveryFee = GHN_URL_CALCULATE_DELIVERY_FEE;
        this.ghnUrlCreateOrder = GHN_URL_CREATE_ORDER;
        this.ghnUrlCancelOrder = GHN_URL_CANCEL_ORDER;
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

    /**
     * Xác định loại dịch vụ GHN dựa trên kích thước và trọng lượng.
     */

    private determineServiceType(length: number = 0, width: number = 0, height: number = 0, weight: number = 0): number {
        if (length > 150 || width > 150 || height > 150 || weight > 20000) {
            return GhnServiceTypeId.HANG_NANG;
        }
        return GhnServiceTypeId.HANG_NHE;
    }


    async getIdProvince(provinceNameInput: string): Promise<number | null> {
        if (!provinceNameInput || provinceNameInput.trim() === '') {
            this.logger.warn('getIdProvince called with empty input name.');
            return null;
        }

        // Bước 1: Kiểm tra trong database trước
        try {
            const dbProvince = await this.oldAddressService.findProvinceByName(provinceNameInput);
            if (dbProvince) {
                // Nếu đã có ghn_code trong DB thì trả về luôn
                if (dbProvince.ghn_code) {
                    this.logger.log(`Found province "${provinceNameInput}" in DB with GHN code: ${dbProvince.ghn_code}`);
                    return parseInt(dbProvince.ghn_code);
                }
                // Nếu chưa có ghn_code, tiếp tục gọi API và lưu lại
                this.logger.log(`Found province "${provinceNameInput}" in DB (code: ${dbProvince.code}) but no GHN code, will query GHN API`);
            }
        } catch (error) {
            this.logger.error(`Error checking province in DB: ${error.message}`);
        }

        // Bước 2: Gọi GHN API nếu cần
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
                        
                        // Lưu ghn_code vào DB
                        try {
                            const dbProvince = await this.oldAddressService.findProvinceByName(provinceNameInput);
                            if (dbProvince) {
                                await this.oldAddressService.updateProvinceGhnCode(dbProvince.code, province.ProvinceID);
                            }
                        } catch (error) {
                            this.logger.error(`Failed to update province GHN code in DB: ${error.message}`);
                        }
                        
                        return province.ProvinceID;
                    }
                    // So sánh với NameExtension của API (chỉ chuyển sang chữ thường và trim)
                    if (province.NameExtension?.some(ext => this.simplifyApiName(ext) === this.simplifyApiName(normalizedUserInput))) {
                        this.logger.log(`Match for "${provinceNameInput}" (normalized: "${normalizedUserInput}") with API NameExtension. ID: ${province.ProvinceID}`);
                        
                        // Lưu ghn_code vào DB
                        try {
                            const dbProvince = await this.oldAddressService.findProvinceByName(provinceNameInput);
                            if (dbProvince) {
                                await this.oldAddressService.updateProvinceGhnCode(dbProvince.code, province.ProvinceID);
                            }
                        } catch (error) {
                            this.logger.error(`Failed to update province GHN code in DB: ${error.message}`);
                        }
                        
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

        // Bước 1: Tìm province trong DB để lấy province_code
        let provinceCode: number | null = null;
        try {
            const provinces = await this.oldAddressService.getProvinces();
            const dbProvince = provinces.find(p => p.ghn_code === provinceId.toString());
            if (dbProvince) {
                provinceCode = dbProvince.code;
                // Kiểm tra district trong DB
                const dbDistrict = await this.oldAddressService.findDistrictByName(districtNameInput, provinceCode);
                if (dbDistrict) {
                    if (dbDistrict.ghn_code) {
                        this.logger.log(`Found district "${districtNameInput}" in DB with GHN code: ${dbDistrict.ghn_code}`);
                        return parseInt(dbDistrict.ghn_code);
                    }
                    this.logger.log(`Found district "${districtNameInput}" in DB (code: ${dbDistrict.code}) but no GHN code, will query GHN API`);
                }
            }
        } catch (error) {
            this.logger.error(`Error checking district in DB: ${error.message}`);
        }

        // Bước 2: Gọi GHN API
        const headers = {
            'Token': this.ghnToken,
            'Content-Type': 'application/json',
        };
        const payload = { province_id: provinceId };
        this.logger.log(`Fetching GHN districts for input: "${districtNameInput}" in province ID: ${provinceId}`);

        const districtPrefixes = ["quận", "huyện", "thị xã", "thành phố", "q.", "tx."];
        const normalizedUserInput = this.normalizeUserInputLocationName(districtNameInput, districtPrefixes);
        this.logger.debug(`Normalized user input for district: "${normalizedUserInput}"`);

        try {
            const response = await firstValueFrom(
                this.httpService.post<GhnApiResponse<GhnDistrict[]>>(this.ghnUrlGetDistrict, payload, { headers })
            );

            if (response.data && response.data.code === 200 && Array.isArray(response.data.data)) {
                const districts: GhnDistrict[] = response.data.data;

                for (const district of districts) {
                    if (this.simplifyApiName(district.DistrictName) === this.simplifyApiName(normalizedUserInput)) {
                        this.logger.log(`Match for "${districtNameInput}" (normalized: "${normalizedUserInput}") with API DistrictName "${district.DistrictName}". ID: ${district.DistrictID}`);
                        
                        // Lưu ghn_code vào DB
                        if (provinceCode) {
                            try {
                                const dbDistrict = await this.oldAddressService.findDistrictByName(districtNameInput, provinceCode);
                                if (dbDistrict) {
                                    await this.oldAddressService.updateDistrictGhnCode(dbDistrict.code, district.DistrictID);
                                }
                            } catch (error) {
                                this.logger.error(`Failed to update district GHN code in DB: ${error.message}`);
                            }
                        }
                        
                        return district.DistrictID;
                    }
                    if (district.NameExtension?.some(ext => this.simplifyApiName(ext) === this.simplifyApiName(normalizedUserInput))) {
                        this.logger.log(`Match for "${districtNameInput}" (normalized: "${normalizedUserInput}") with API NameExtension. ID: ${district.DistrictID}`);
                        
                        // Lưu ghn_code vào DB
                        if (provinceCode) {
                            try {
                                const dbDistrict = await this.oldAddressService.findDistrictByName(districtNameInput, provinceCode);
                                if (dbDistrict) {
                                    await this.oldAddressService.updateDistrictGhnCode(dbDistrict.code, district.DistrictID);
                                }
                            } catch (error) {
                                this.logger.error(`Failed to update district GHN code in DB: ${error.message}`);
                            }
                        }
                        
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

        // Bước 1: Tìm district trong DB để lấy district_code
        let districtCode: number | null = null;
        try {
            const allProvinces = await this.oldAddressService.getProvinces();
            for (const province of allProvinces) {
                const districts = await this.oldAddressService.getDistricts(province.code);
                const dbDistrict = districts.find(d => d.ghn_code === districtId.toString());
                if (dbDistrict) {
                    districtCode = dbDistrict.code;
                    // Kiểm tra ward trong DB
                    const dbWard = await this.oldAddressService.findWardByName(wardNameInput, districtCode);
                    if (dbWard) {
                        if (dbWard.ghn_code) {
                            this.logger.log(`Found ward "${wardNameInput}" in DB with GHN code: ${dbWard.ghn_code}`);
                            return dbWard.ghn_code;
                        }
                        this.logger.log(`Found ward "${wardNameInput}" in DB (code: ${dbWard.code}) but no GHN code, will query GHN API`);
                    }
                    break;
                }
            }
        } catch (error) {
            this.logger.error(`Error checking ward in DB: ${error.message}`);
        }

        // Bước 2: Gọi GHN API
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
                        
                        // Lưu ghn_code vào DB
                        if (districtCode) {
                            try {
                                const dbWard = await this.oldAddressService.findWardByName(wardNameInput, districtCode);
                                if (dbWard) {
                                    await this.oldAddressService.updateWardGhnCode(dbWard.code, ward.WardCode);
                                }
                            } catch (error) {
                                this.logger.error(`Failed to update ward GHN code in DB: ${error.message}`);
                            }
                        }
                        
                        return ward.WardCode;
                    }
                    // So sánh với NameExtension của API (chỉ chuyển sang chữ thường và trim)
                    if (ward.NameExtension?.some(ext => this.simplifyApiName(ext) === this.simplifyApiName(normalizedUserInput))) {
                        this.logger.log(`Match for "${wardNameInput}" (normalized: "${normalizedUserInput}") with API NameExtension. Code: ${ward.WardCode}`);
                        
                        // Lưu ghn_code vào DB
                        if (districtCode) {
                            try {
                                const dbWard = await this.oldAddressService.findWardByName(wardNameInput, districtCode);
                                if (dbWard) {
                                    await this.oldAddressService.updateWardGhnCode(dbWard.code, ward.WardCode);
                                }
                            } catch (error) {
                                this.logger.error(`Failed to update ward GHN code in DB: ${error.message}`);
                            }
                        }
                        
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
    
    
    async calculateShippingFeeViaGHN(calculateDto: CalculateShippingFeeDto): Promise<GhnFeeData> {
        const headers = {
            'Content-Type': 'application/json',
            'Token': this.ghnToken,
            'ShopId': this.ghnShopId,
        };

        this.logger.log(`[GHN Fee] Calling GHN Fee API for: ${JSON.stringify(calculateDto)}`);
        this.logger.debug(`[GHN Fee] Headers: Token: ${this.ghnToken.substring(0, 5)}..., ShopId: ${this.ghnShopId}`);

        const service_type_id = this.determineServiceType(
            calculateDto.length,
            calculateDto.width,
            calculateDto.height,
            calculateDto.weight
        );

        const dto = {
            ...calculateDto,
            service_type_id: service_type_id
        }
        this.logger.debug(`[GHN Fee] Payload: ${JSON.stringify(dto,null,2)}`);
        try {
            const response = await firstValueFrom(
                this.httpService.post<GhnFeeResponseDto>(this.ghnUrlCalculateDeliveryFee, dto, { headers }).pipe(
                    map(axiosResponse => {
                        this.logger.debug(`[GHN Fee] Raw response from GHN: ${JSON.stringify(axiosResponse.data)}`);
                        const ghnData = axiosResponse.data;

                        if (!ghnData || typeof ghnData.code !== 'number') {
                            this.logger.error('[GHN Fee] Unexpected response structure from GHN (missing code).');
                            throw new InternalServerErrorException('Phản hồi không mong đợi từ dịch vụ tính phí GHN.');
                        }

                        if (ghnData.code === 200) {
                            if (!ghnData.data) {
                                this.logger.warn('[GHN Fee] GHN Success but no fee data found.');
                                throw new BadRequestException('Không thể tính phí vận chuyển từ GHN (không có dữ liệu phí).');
                            }
                            this.logger.log(`[GHN Fee] Successfully calculated fee.`);
                            return ghnData.data;
                        } else {
                            // Xử lý các mã lỗi khác từ GHN
                            const errorMessage = ghnData.message || `GHN API returned an error.`;
                            this.logger.error(`[GHN Fee] GHN API error. Code: ${ghnData.code}, Message: ${errorMessage}`);
                            throw new BadRequestException(`${errorMessage} (GHN Code: ${ghnData.code})`);
                        }
                    }),
                    catchError((error: any) => {
                        if (error instanceof HttpException) {
                            throw error;
                        }
                        if (error instanceof AxiosError) {
                            let statusCodeToThrow = 500;
                            let errorMessageToThrow = 'Lỗi không mong đợi khi giao tiếp với dịch vụ GHN.';
                            let shouldRetryWithHangNang = false;
                            
                            if (error.response) {
                                const status = error.response.status;
                                let specificGhnMessage: string | null = null;
                                if (error.response.data && typeof error.response.data === 'object') {
                                    const responseData = error.response.data as any;
                                    // GHN có thể trả về lỗi trong `message` hoặc `error_message` hoặc các trường khác
                                    specificGhnMessage = responseData.message || responseData.error_message || responseData.code_message_value || (typeof responseData === 'string' ? responseData : null);
                                    
                                    // Check if error is about missing ServiceID
                                    if (specificGhnMessage && specificGhnMessage.includes("ServiceID") && specificGhnMessage.includes("required")) {
                                        shouldRetryWithHangNang = true;
                                    }
                                } else if (typeof error.response.data === 'string') {
                                    specificGhnMessage = error.response.data;
                                }

                                this.logger.error(`[GHN Fee] Axios error from GHN. Status: ${status}, Data: ${JSON.stringify(error.response.data)}`);

                                if (status === 400) { // Bad Request từ GHN (thường do dữ liệu đầu vào sai)
                                    statusCodeToThrow = 400;
                                    errorMessageToThrow = specificGhnMessage || 'Dữ liệu gửi đến GHN không hợp lệ.';
                                } else if (status === 401 || status === 403) { // Unauthorized/Forbidden (Token, ShopId sai)
                                    statusCodeToThrow = 500; // Hoặc 401/403 tùy bạn muốn client xử lý thế nào
                                    errorMessageToThrow = 'Lỗi xác thực với dịch vụ GHN. Vui lòng kiểm tra Token/ShopId.';
                                } else { // Các lỗi HTTP khác
                                    statusCodeToThrow = 500;
                                    errorMessageToThrow = `Dịch vụ GHN gặp lỗi (Status ${status}). ${specificGhnMessage ? `Chi tiết: ${specificGhnMessage}` : 'Không có chi tiết.'}`;
                                }
                            } else if (error.request) {
                                this.logger.error('[GHN Fee] No response received from GHN service.', error.stack);
                                statusCodeToThrow = 502; // Bad Gateway
                                errorMessageToThrow = 'Không thể kết nối hoặc nhận phản hồi từ dịch vụ GHN.';
                            } else {
                                this.logger.error(`[GHN Fee] Error setting up request to GHN service: ${error.message}`, error.stack);
                                statusCodeToThrow = 500;
                                errorMessageToThrow = `Lỗi khi chuẩn bị yêu cầu đến dịch vụ GHN: ${error.message}`;
                            }
                            
                            // If should retry with HANG_NANG, throw a special error
                            if (shouldRetryWithHangNang) {
                                const retryError: any = new BadRequestException(errorMessageToThrow);
                                retryError.shouldRetryWithHangNang = true;
                                throw retryError;
                            }
                            
                            switch (statusCodeToThrow) {
                                case 400: throw new BadRequestException(errorMessageToThrow);
                                case 502: throw new HttpException(errorMessageToThrow, 502);
                                default: throw new InternalServerErrorException(errorMessageToThrow);
                            }
                        }
                        this.logger.error(`[GHN Fee] Unknown error during GHN Fee API call.`, error.stack);
                        throw new InternalServerErrorException('Lỗi không xác định khi tính phí vận chuyển GHN.');
                    }),
                ),
            );
            return response;
        } catch (error) {
            // Retry with HANG_NANG if needed
            if (error.shouldRetryWithHangNang && dto.service_type_id !== GhnServiceTypeId.HANG_NANG) {
                this.logger.warn(`[GHN Fee] Retrying with service_type_id = HANG_NANG (5)`);
                const retryDto = {
                    ...dto,
                    service_type_id: GhnServiceTypeId.HANG_NANG
                };
                
                try {
                    const retryResponse = await firstValueFrom(
                        this.httpService.post<GhnFeeResponseDto>(this.ghnUrlCalculateDeliveryFee, retryDto, { headers }).pipe(
                            map(axiosResponse => {
                                this.logger.debug(`[GHN Fee] Raw response from GHN (retry): ${JSON.stringify(axiosResponse.data)}`);
                                const ghnData = axiosResponse.data;

                                if (!ghnData || typeof ghnData.code !== 'number') {
                                    this.logger.error('[GHN Fee] Unexpected response structure from GHN (missing code).');
                                    throw new InternalServerErrorException('Phản hồi không mong đợi từ dịch vụ tính phí GHN.');
                                }

                                if (ghnData.code === 200) {
                                    if (!ghnData.data) {
                                        this.logger.warn('[GHN Fee] GHN Success but no fee data found.');
                                        throw new BadRequestException('Không thể tính phí vận chuyển từ GHN (không có dữ liệu phí).');
                                    }
                                    this.logger.log(`[GHN Fee] Successfully calculated fee with HANG_NANG.`);
                                    return ghnData.data;
                                } else {
                                    const errorMessage = ghnData.message || `GHN API returned an error.`;
                                    this.logger.error(`[GHN Fee] GHN API error. Code: ${ghnData.code}, Message: ${errorMessage}`);
                                    throw new BadRequestException(`${errorMessage} (GHN Code: ${ghnData.code})`);
                                }
                            }),
                            catchError((retryError: any) => {
                                if (retryError instanceof HttpException) {
                                    throw retryError;
                                }
                                this.logger.error(`[GHN Fee] Retry with HANG_NANG also failed: ${retryError.message}`);
                                throw new BadRequestException('Không thể tính phí vận chuyển từ GHN.');
                            }),
                        ),
                    );
                    return retryResponse;
                } catch (retryError) {
                    this.logger.error(`[GHN Fee] Failed to calculate shipping fee after retry: ${retryError.message}`);
                    throw retryError;
                }
            }
            
            this.logger.error(`[GHN Fee] Failed to calculate shipping fee: ${error.message}`);
            throw error;
        }
    }
    
    
    
    
    
    
    async createOrderByGHN(createOrderDto: CreateGhnOrderDto): Promise<GhnCreatedOrderDataDto> {

        const headers = {
            'Content-Type': 'application/json',
            'Token': this.ghnToken,
            'ShopId': this.ghnShopId,
        };

        const service_type_id = this.determineServiceType(
            createOrderDto.length,
            createOrderDto.width,
            createOrderDto.height,
            createOrderDto.weight
        );

        const dto = {
            ...createOrderDto,
            service_type_id: service_type_id
        }


        this.logger.log(`[GHN Create Order] Calling API for client_order_code: ${createOrderDto.client_order_code || 'N/A'}`);
        this.logger.debug(`[GHN Create Order] Payload: ${JSON.stringify(createOrderDto,null,2)}`);
        this.logger.debug(`[GHN Create Order] Headers: Token: ${this.ghnToken.substring(0, 5)}..., ShopId: ${this.ghnShopId}`);

        

        try {
            const response = await firstValueFrom(
                this.httpService.post<GhnCreateOrderResponseDto>(this.ghnUrlCreateOrder, dto, { headers }).pipe(
                    map(axiosResponse => {
                        this.logger.debug(`[GHN Create Order] Raw response from GHN: ${JSON.stringify(axiosResponse.data)}`);
                        const ghnResponse = axiosResponse.data;

                        if (!ghnResponse || typeof ghnResponse.code !== 'number') {
                            this.logger.error('[GHN Create Order] Unexpected response structure from GHN (missing code).');
                            throw new InternalServerErrorException('Phản hồi không mong đợi từ dịch vụ tạo đơn GHN.');
                        }

                        if (ghnResponse.code === 200) { // Thành công
                            if (!ghnResponse.data || !ghnResponse.data.order_code) {
                                this.logger.warn('[GHN Create Order] GHN Success but no order data or order_code found.');
                                throw new InternalServerErrorException('Tạo đơn GHN thành công nhưng không nhận được dữ liệu đơn hàng.');
                            }
                            this.logger.log(`[GHN Create Order] Successfully created order. GHN Order Code: ${ghnResponse.data.order_code}`);
                            return ghnResponse.data;
                        } else {
                            const errorMessage = ghnResponse.message || ghnResponse.message_display || `GHN API returned an error.`;
                            this.logger.error(`[GHN Create Order] GHN API error. Code: ${ghnResponse.code}, Message: ${errorMessage}, Full Response: ${JSON.stringify(ghnResponse)}`);
                            throw new BadRequestException(`${errorMessage} (GHN Code: ${ghnResponse.code})`);
                        }
                    }),
                    catchError((error: any) => {
                        if (error instanceof HttpException) {
                            throw error;
                        }
                        if (error instanceof AxiosError) {
                            let statusCodeToThrow = 500;
                            let errorMessageToThrow = 'Lỗi không mong đợi khi giao tiếp với dịch vụ GHN.';
                            if (error.response) {
                                const status = error.response.status;
                                let specificGhnMessage: string | null = null;
                                if (error.response.data) {
                                    const responseData = error.response.data as any;
                                    specificGhnMessage = responseData.message_display || responseData.message || (responseData.data && responseData.data.message) || (typeof responseData === 'string' ? responseData : null);
                                    if (responseData.errors && typeof responseData.errors === 'object') { // Nếu GHN trả về lỗi validation chi tiết
                                        const validationErrors = Object.values(responseData.errors).flat().join('; ');
                                        specificGhnMessage = specificGhnMessage ? `${specificGhnMessage}. Details: ${validationErrors}` : `Validation errors: ${validationErrors}`;
                                    }
                                } else if (typeof error.response.data === 'string') {
                                    specificGhnMessage = error.response.data;
                                }

                                this.logger.error(`[GHN Create Order] Axios error from GHN. Status: ${status}, Data: ${JSON.stringify(error.response.data)}`);

                                if (status === 400) {
                                    statusCodeToThrow = 400;
                                    errorMessageToThrow = specificGhnMessage || 'Dữ liệu gửi đến GHN không hợp lệ để tạo đơn hàng.';
                                } else if (status === 401 || status === 403) {
                                    statusCodeToThrow = 500;
                                    errorMessageToThrow = 'Lỗi xác thực với dịch vụ GHN (Token/ShopId).';
                                } else {
                                    statusCodeToThrow = 500;
                                    errorMessageToThrow = `Dịch vụ GHN gặp lỗi HTTP (Status ${status}). ${specificGhnMessage ? `Chi tiết: ${specificGhnMessage}` : 'Không có chi tiết.'}`;
                                }
                            } else if (error.request) {
                                this.logger.error('[GHN Create Order] No response received from GHN service.', error.stack);
                                statusCodeToThrow = 502;
                                errorMessageToThrow = 'Không thể kết nối hoặc nhận phản hồi từ dịch vụ GHN.';
                            } else {
                                this.logger.error(`[GHN Create Order] Error setting up request to GHN service: ${error.message}`, error.stack);
                                statusCodeToThrow = 500;
                                errorMessageToThrow = `Lỗi khi chuẩn bị yêu cầu đến dịch vụ GHN: ${error.message}`;
                            }
                            switch (statusCodeToThrow) {
                                case 400: throw new BadRequestException(errorMessageToThrow);
                                case 502: throw new HttpException(errorMessageToThrow, 502);
                                default: throw new InternalServerErrorException(errorMessageToThrow);
                            }
                        }
                        this.logger.error(`[GHN Create Order] Unknown error during GHN Create Order API call.`, error.stack);
                        throw new InternalServerErrorException('Lỗi không xác định khi tạo đơn hàng GHN.');
                    }),
                ),
            );
            return response;
        } catch (error) {
            this.logger.error(`[GHN Create Order] Failed to create GHN order: ${error.message}`, error.stack);
            throw error;
        }
    }
    
}