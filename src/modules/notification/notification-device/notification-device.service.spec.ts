import { Test, TestingModule } from '@nestjs/testing';
import { NotificationDeviceService } from './notification-device.service';

describe('NotificationDeviceService', () => {
  let service: NotificationDeviceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationDeviceService],
    }).compile();

    service = module.get<NotificationDeviceService>(NotificationDeviceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
