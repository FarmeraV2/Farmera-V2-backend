import { Test, TestingModule } from '@nestjs/testing';
import { AddressService } from './address.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Province } from '../entities/province.entity';
import { Ward } from '../entities/ward.entity';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

describe('AddressService', () => {
    let service: AddressService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AddressService, ConfigService,
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

        service = module.get<AddressService>(AddressService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
