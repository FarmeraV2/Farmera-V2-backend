import { Test, TestingModule } from '@nestjs/testing';
import { ProductManagementController } from './product-management.controller';

describe('ProductManagementController', () => {
  let controller: ProductManagementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductManagementController],
    }).compile();

    controller = module.get<ProductManagementController>(ProductManagementController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
