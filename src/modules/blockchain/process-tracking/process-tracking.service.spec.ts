import { Test, TestingModule } from '@nestjs/testing';
import { ProcessTrackingService } from './process-tracking.service';

describe('ProcessTrackingService', () => {
  let service: ProcessTrackingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProcessTrackingService],
    }).compile();

    service = module.get<ProcessTrackingService>(ProcessTrackingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
