import { Test, TestingModule } from '@nestjs/testing';
import { TransparencyWeightService } from './transparency-weight.service';

describe('TransparencyWeightService', () => {
  let service: TransparencyWeightService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransparencyWeightService],
    }).compile();

    service = module.get<TransparencyWeightService>(TransparencyWeightService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
