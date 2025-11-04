import { Test, TestingModule } from '@nestjs/testing';
import { NotificationDeviceController } from './notification-device.controller';

describe('NotificationDeviceController', () => {
  let controller: NotificationDeviceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationDeviceController],
    }).compile();

    controller = module.get<NotificationDeviceController>(NotificationDeviceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
