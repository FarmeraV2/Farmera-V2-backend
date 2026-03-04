import { Test, TestingModule } from '@nestjs/testing';
import { CropManagementService } from './crop-management.service';

describe('CropManagementService', () => {
  let service: CropManagementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CropManagementService],
    }).compile();

    service = module.get<CropManagementService>(CropManagementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
