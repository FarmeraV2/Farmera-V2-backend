import { Test, TestingModule } from '@nestjs/testing';
import { FarmApprovalController } from './farm-approval.controller';

describe('FarmApprovalController', () => {
  let controller: FarmApprovalController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FarmApprovalController],
    }).compile();

    controller = module.get<FarmApprovalController>(FarmApprovalController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
