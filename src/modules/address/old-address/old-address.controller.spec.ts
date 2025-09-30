import { Test, TestingModule } from '@nestjs/testing';
import { OldAddressController } from './old-address.controller';
import { OldAddressService } from './old-address.service';

describe('OldAddressController', () => {
  let controller: OldAddressController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OldAddressController],
      providers: [
        {
          provide: OldAddressService,
          useValue: {}
        }
      ]
    }).compile();

    controller = module.get<OldAddressController>(OldAddressController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
