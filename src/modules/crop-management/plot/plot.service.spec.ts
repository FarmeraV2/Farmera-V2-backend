import { Test, TestingModule } from '@nestjs/testing';
import { PlotService } from './plot.service';

describe('PlotService', () => {
  let service: PlotService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlotService],
    }).compile();

    service = module.get<PlotService>(PlotService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
