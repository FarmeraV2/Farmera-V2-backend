import { Test, TestingModule } from '@nestjs/testing';
import { FarmController } from './farm.controller';

describe('FarmController', () => {
  let controller: FarmController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FarmController],
    }).compile();

    controller = module.get<FarmController>(FarmController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
