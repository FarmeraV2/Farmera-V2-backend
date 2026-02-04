import { Test, TestingModule } from '@nestjs/testing';
import { TrustworthinessService } from './trustworthiness.service';

describe('TrustworthinessService', () => {
  let service: TrustworthinessService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TrustworthinessService],
    }).compile();

    service = module.get<TrustworthinessService>(TrustworthinessService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
