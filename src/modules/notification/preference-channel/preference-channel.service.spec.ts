import { Test, TestingModule } from '@nestjs/testing';
import { PreferenceChannelService } from './preference-channel.service';

describe('PreferenceChannelService', () => {
  let service: PreferenceChannelService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PreferenceChannelService],
    }).compile();

    service = module.get<PreferenceChannelService>(PreferenceChannelService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
