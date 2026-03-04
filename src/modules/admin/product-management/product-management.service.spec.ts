import { Test, TestingModule } from '@nestjs/testing';
import { ProductManagementService } from './product-management.service';

describe('ProductManagementService', () => {
  let service: ProductManagementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductManagementService],
    }).compile();

    service = module.get<ProductManagementService>(ProductManagementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
