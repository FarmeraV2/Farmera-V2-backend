import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from 'src/modules/user/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { VerificationService } from '../verification/verification.service';
import { FarmService } from 'src/modules/farm/farm/farm.service';

describe('AuthService', () => {
    let service: AuthService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService, ConfigService,
                {
                    provide: UserService,
                    useValue: {}
                },
                {
                    provide: JwtService,
                    useValue: {}
                },
                {
                    provide: VerificationService,
                    useValue: {}
                },
                {
                    provide: FarmService,
                    useValue: {}
                }
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
