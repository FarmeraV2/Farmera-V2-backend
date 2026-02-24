import { Test, TestingModule } from '@nestjs/testing';
import { FarmCertificateService } from './farm-certificate.service';

describe('FarmCertificateService', () => {
  let service: FarmCertificateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FarmCertificateService],
    }).compile();

    service = module.get<FarmCertificateService>(FarmCertificateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
