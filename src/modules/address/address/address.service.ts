import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Province } from '../entities/province.entity';
import { Ward } from '../entities/ward.entity';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

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
        // import province
        const provinceCodes = await this.importProvince();
        if (provinceCodes && provinceCodes.length > 0) {
            // for each province, import ward
            await this.importWard(provinceCodes);
        } else {
            const result = await this.provinceRepository.find({ select: ['code'] });
            const codes = result.map((p) => p.code);
            await this.importWard(codes);
        }
    }

    private async importProvince(): Promise<number[] | undefined> {
        const count = await this.provinceRepository.count();
        if (count > 0) {
            return;
        }
        // fetch province
        if (!this.addressApi) {
            this.logger.error('External address api is not configured');
            return;
        }
        try {
            const response = await firstValueFrom(this.httpService.get(`${this.addressApi}/provider`));
            const provinces: Province[] = response.data.map((province: Province) => this.provinceRepository.create(province));
            const saved = await this.provinceRepository.save(provinces);

            // extract province code
            const result = saved.map((p) => p.code);
            return result;
        } catch (error) {
            this.logger.error(error.message);
            return;
        }
    }

    private async importWard(provinceCodes: number[]) {
        const count = await this.wardRepository.count();
        if (count > 0) {
            return;
        }
        if (!this.addressApi) {
            this.logger.error('External address api is not configured');
            return;
        }

        try {
            for (const provinceCode of provinceCodes) {
                const response = await firstValueFrom(this.httpService.get(`${this.addressApi}/ward/${provinceCode}`));

                const wards: Ward[] = response.data.map((ward: Ward) => this.wardRepository.create({ ...ward, province: { code: provinceCode } }));

                await this.wardRepository.save(wards);
            }
        } catch (error) {
            this.logger.error(error.message);
        }
    }

    async getAllProvinces(): Promise<Province[]> {
        try {
            const provinces = await this.provinceRepository.find();
            return provinces;
        } catch (error) {
            this.logger.error(error.message);
            throw new InternalServerErrorException('Failed to get provinces');
        }
    }

    async getWardByProvinceCode(code: number): Promise<Ward[]> {
        try {
            const wards = await this.wardRepository.find({ where: { province: { code } } });
            return wards;
        } catch (error) {
            this.logger.error(error.message);
            throw new InternalServerErrorException('Failed to get wards');
        }
    }
}
