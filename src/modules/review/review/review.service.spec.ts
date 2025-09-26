import { Test, TestingModule } from '@nestjs/testing';
import { ReviewService } from './review.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Review } from '../entities/review.entity';
import { Reply } from '../entities/reply.entity';

describe('ReviewService', () => {
    let service: ReviewService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ReviewService,
                {
                    provide: getRepositoryToken(Review),
                    useValue: {}
                },
                {
                    provide: getRepositoryToken(Reply),
                    useValue: {}
                },
            ],
        }).compile();

        service = module.get<ReviewService>(ReviewService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
