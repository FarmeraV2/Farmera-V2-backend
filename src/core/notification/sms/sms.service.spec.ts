import { Test, TestingModule } from '@nestjs/testing';
import { SmsService } from './sms.service';
import { ConfigService } from '@nestjs/config';

describe.skip('SmsService', () => {
    let service: SmsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [SmsService, ConfigService],
        }).compile();

        service = module.get<SmsService>(SmsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
