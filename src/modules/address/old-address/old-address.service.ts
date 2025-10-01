import { HttpException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OldProvince } from '../entities/old-province.entity';
import { OldDistrict } from '../entities/old-district.entity';
import { OldWard } from '../entities/old-ward.entity';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OldAddressService {

    private readonly logger = new Logger(OldAddressService.name);
    private addressApi: string | undefined;

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

    async onApplicationBootstrap() {
        await this.importAddresses();
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

    async getAllProvinces(): Promise<OldProvince[]> {
        try {
            return await this.oldProvinceRepository.find();
        }
        catch (error) {
            this.logger.error(error.message);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException("Failed to get provinces");
        }
    }

    async getDistrictsByProvince(code: number): Promise<OldDistrict[]> {
        try {
            return await this.oldDistrictRepository.find({ where: { province_code: code } });
        }
        catch (error) {
            this.logger.error(error.message);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException("Failed to get districts");
        }
    }

    async getWardsByDistrict(code: number): Promise<OldWard[]> {
        try {
            return await this.oldWardRepository.find({ where: { district_code: code } });
        }
        catch (error) {
            this.logger.error(error.message);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException("Failed to get wards");
        }
    }
}
