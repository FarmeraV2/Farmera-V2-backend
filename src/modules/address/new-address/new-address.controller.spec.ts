import { Test, TestingModule } from '@nestjs/testing';
import { NewAddressController } from './new-address.controller';
import { NewAddressService } from './new-address.service';

describe('NewAddressController', () => {
    let controller: NewAddressController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [NewAddressController],
            providers: [
                {
                    provide: NewAddressService,
                    useValue: {}
                }
            ]
        }).compile();

        controller = module.get<NewAddressController>(NewAddressController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
