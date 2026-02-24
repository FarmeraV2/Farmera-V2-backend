import { Test, TestingModule } from '@nestjs/testing';
import { NewAddressService } from './new-address.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Province } from '../entities/province.entity';
import { Ward } from '../entities/ward.entity';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

describe('NewAddressService', () => {
    let service: NewAddressService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                NewAddressService, ConfigService,
                {
                    provide: getRepositoryToken(Province),
                    useValue: {},
                },
                {
                    provide: getRepositoryToken(Ward),
                    useValue: {},
                },
                {
                    provide: HttpService,
                    useValue: {},
                }
            ],
        }).compile();

        service = module.get<NewAddressService>(NewAddressService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
