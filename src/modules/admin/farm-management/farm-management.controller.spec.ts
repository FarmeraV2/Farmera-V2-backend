import { Test, TestingModule } from '@nestjs/testing';
import { FarmManagementController } from './farm-management.controller';

describe('FarmManagementController', () => {
  let controller: FarmManagementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FarmManagementController],
    }).compile();

    controller = module.get<FarmManagementController>(FarmManagementController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
