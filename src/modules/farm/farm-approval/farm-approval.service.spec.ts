import { Test, TestingModule } from '@nestjs/testing';
import { FarmApprovalService } from './farm-approval.service';

describe('FarmApprovalService', () => {
  let service: FarmApprovalService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FarmApprovalService],
    }).compile();

    service = module.get<FarmApprovalService>(FarmApprovalService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
