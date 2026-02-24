import { Test, TestingModule } from '@nestjs/testing';
import { FarmManagementService } from './farm-management.service';

describe('FarmManagementService', () => {
  let service: FarmManagementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FarmManagementService],
    }).compile();

    service = module.get<FarmManagementService>(FarmManagementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
