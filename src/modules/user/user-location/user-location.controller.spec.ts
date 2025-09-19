import { Test, TestingModule } from '@nestjs/testing';
import { UserLocationController } from './user-location.controller';

describe('UserLocationController', () => {
  let controller: UserLocationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserLocationController],
    }).compile();

    controller = module.get<UserLocationController>(UserLocationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
