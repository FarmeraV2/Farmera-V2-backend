import { Test, TestingModule } from '@nestjs/testing';
import { AzureBlobController } from './azure-blob.controller';

describe('AzureBlobController', () => {
  let controller: AzureBlobController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AzureBlobController],
    }).compile();

    controller = module.get<AzureBlobController>(AzureBlobController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
