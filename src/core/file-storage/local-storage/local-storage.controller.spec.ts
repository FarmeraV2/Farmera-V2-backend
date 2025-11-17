import { Test, TestingModule } from '@nestjs/testing';
import { LocalStorageController } from './local-storage.controller';

describe('LocalStorageController', () => {
  let controller: LocalStorageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocalStorageController],
    }).compile();

    controller = module.get<LocalStorageController>(LocalStorageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
