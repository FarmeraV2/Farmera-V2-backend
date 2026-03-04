import { Test, TestingModule } from '@nestjs/testing';
import { TransparencyService } from './transparency.service';

describe('TransparencyService', () => {
  let service: TransparencyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransparencyService],
    }).compile();

    service = module.get<TransparencyService>(TransparencyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
