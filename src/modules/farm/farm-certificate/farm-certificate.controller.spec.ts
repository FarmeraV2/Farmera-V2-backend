import { Test, TestingModule } from '@nestjs/testing';
import { FarmCertificateController } from './farm-certificate.controller';

describe('FarmCertificateController', () => {
  let controller: FarmCertificateController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FarmCertificateController],
    }).compile();

    controller = module.get<FarmCertificateController>(FarmCertificateController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
