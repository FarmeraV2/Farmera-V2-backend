import { Test, TestingModule } from '@nestjs/testing';
import { UserLocationService } from './user-location.service';

describe('UserLocationService', () => {
  let service: UserLocationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserLocationService],
    }).compile();

    service = module.get<UserLocationService>(UserLocationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
