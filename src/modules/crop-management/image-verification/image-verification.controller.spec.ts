import { Test, TestingModule } from '@nestjs/testing';
import { ImageVerificationController } from './image-verification.controller';

describe('ImageVerificationController', () => {
  let controller: ImageVerificationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImageVerificationController],
    }).compile();

    controller = module.get<ImageVerificationController>(ImageVerificationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
