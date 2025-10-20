import { Test, TestingModule } from '@nestjs/testing';
import { VerificationService } from './verification.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Verification } from '../entities/verification.entity';
import { UserService } from 'src/modules/user/user/user.service';

describe('VerificationService', () => {
    let service: VerificationService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                VerificationService,
                {
                    provide: getRepositoryToken(Verification),
                    useValue: {}
                },
                {
                    provide: UserService,
                    useValue: {}
                }
            ],
        }).compile();

        service = module.get<VerificationService>(VerificationService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
