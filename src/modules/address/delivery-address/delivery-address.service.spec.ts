import { Test, TestingModule } from '@nestjs/testing';
import { DeliveryAddressService } from './delivery-address.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DeliveryAddress } from '../entities/delivery-address.entity';

describe('DeliveryAddressService', () => {
    let service: DeliveryAddressService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DeliveryAddressService,
                {
                    provide: getRepositoryToken(DeliveryAddress),
                    useValue: {}
                }
            ],
        }).compile();

        service = module.get<DeliveryAddressService>(DeliveryAddressService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
