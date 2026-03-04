import { Test, TestingModule } from '@nestjs/testing';
import { CropManagementController } from './crop-management.controller';

describe('CropManagementController', () => {
  let controller: CropManagementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CropManagementController],
    }).compile();

    controller = module.get<CropManagementController>(CropManagementController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
