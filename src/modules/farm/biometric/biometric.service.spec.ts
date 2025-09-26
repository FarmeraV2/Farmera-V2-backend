import { Test, TestingModule } from '@nestjs/testing';
import { BiometricService } from './biometric.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';

describe('BiometricService', () => {
    let service: BiometricService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BiometricService, ConfigService,
                {
                    provide: HttpService,
                    useValue: {}
                }
            ],
        }).compile();

        service = module.get<BiometricService>(BiometricService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
