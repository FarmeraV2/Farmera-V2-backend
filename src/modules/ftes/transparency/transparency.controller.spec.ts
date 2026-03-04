import { Test, TestingModule } from '@nestjs/testing';
import { TransparencyController } from './transparency.controller';

describe('TransparencyController', () => {
  let controller: TransparencyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransparencyController],
    }).compile();

    controller = module.get<TransparencyController>(TransparencyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
