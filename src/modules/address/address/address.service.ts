import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Province } from '../entities/province.entity';
import { Ward } from '../entities/ward.entity';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import * as https from 'https';
import { ResponseCode } from 'src/common/constants/response-code.const';

@Injectable()
export class AddressService {
    private readonly logger = new Logger(AddressService.name);

    private addressApi: string | undefined;

    constructor(
        @InjectRepository(Province) private readonly provinceRepository: Repository<Province>,
        @InjectRepository(Ward) private readonly wardRepository: Repository<Ward>,

        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {
        const addressApi = configService.get<string>('ADDRESS_API_ENDPOINT');
        if (!addressApi) {
            this.logger.warn('External address api endpoint not found, pulling address process will be disable');
            return;
        }
        this.addressApi = addressApi;
    }

    async onApplicationBootstrap() {
        // await this.importAddresses();
    }

    private async importAddresses() {
        const count = await this.provinceRepository.count();
        if (count > 0) {
            this.logger.log("Already have old address data, pulling will be skipped")
            return;
        }
        if (!this.addressApi) {
            this.logger.error('External old address api is not configured');
            return;
        }
        try {
            const response = await firstValueFrom(this.httpService.get(`${this.addressApi}?depth=2`, {
                httpsAgent: new https.Agent({ rejectUnauthorized: false })
            }));
            const provinces: Province[] = response.data.map((province: Province) => this.provinceRepository.create(province));
            await this.provinceRepository.save(provinces);
        }
        catch (error) {
            this.logger.error(error.message);
            return;
        }
    }

    async getAllProvinces(): Promise<Province[]> {
        try {
            const provinces = await this.provinceRepository.find();
            return provinces;
        } catch (error) {
            this.logger.error(error.message);
            throw new InternalServerErrorException({
                message: 'Failed to get provinces',
                code: ResponseCode.FAILED_TO_GET_PROVINCES,
            });
        }
    }

    async getWardByProvinceCode(code: number): Promise<Ward[]> {
        try {
            const wards = await this.wardRepository.find({ where: { province_code: code } });
            return wards;
        } catch (error) {
            this.logger.error(error.message);
            throw new InternalServerErrorException({
                message: 'Failed to get wards',
                code: ResponseCode.FAILED_TO_GET_WARDS
            });
        }
    }
}
