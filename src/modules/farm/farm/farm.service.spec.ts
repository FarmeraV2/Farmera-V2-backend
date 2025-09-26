import { Test, TestingModule } from '@nestjs/testing';
import { FarmService } from './farm.service';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { Farm } from '../entities/farm.entity';
import { BiometricService } from '../biometric/biometric.service';
import { DeliveryAddressService } from 'src/modules/address/delivery-address/delivery-address.service';

describe('FarmService', () => {
    let service: FarmService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FarmService,
                {
                    provide: getRepositoryToken(Farm),
                    useValue: {}
                },
                {
                    provide: getDataSourceToken(),
                    useValue: {}
                },
                {
                    provide: BiometricService,
                    useValue: {}
                },
                {
                    provide: DeliveryAddressService,
                    useValue: {}
                }
            ],
        }).compile();

        service = module.get<FarmService>(FarmService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
