import { Module } from '@nestjs/common';
import { ReviewController } from './review/review.controller';
import { ReviewService } from './review/review.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './entities/review.entity';
import { Reply } from './entities/reply.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Review, Reply])],
    controllers: [ReviewController],
    providers: [ReviewService],
})
export class ReviewModule {}
