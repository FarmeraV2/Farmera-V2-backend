import { Test, TestingModule } from '@nestjs/testing';
import { ImageVerificationService } from './image-verification.service';

describe('ImageVerificationService', () => {
  let service: ImageVerificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImageVerificationService],
    }).compile();

    service = module.get<ImageVerificationService>(ImageVerificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
