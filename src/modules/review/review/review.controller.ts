import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ReviewService } from './review.service';
import { User } from 'src/common/decorators/user.decorator';
import { UserInterface } from 'src/common/types/user.interface';
import { Roles } from 'src/common/decorators/role.decorator';
import { UserRole } from 'src/common/enums/role.enum';
import { Public } from 'src/common/decorators/public.decorator';
import { CreateReviewDto } from '../dtos/review/create-review.dto';
import { CreateReplyDto } from '../dtos/review/create-reply.dto';
import { GetReviewsDto } from '../dtos/review/get-review.dto';

@Controller('review')
export class ReviewController {
    constructor(private readonly reviewService: ReviewService) {}

    @Post()
    // @Roles([UserRole.BUYER])
    async createReview(@User() user: UserInterface, @Body() createReviewDto: CreateReviewDto) {
        return await this.reviewService.createReview(createReviewDto, user.id);
    }

    @Post('reply')
    @Roles([UserRole.FARMER])
    async createReply(@User() user: UserInterface, @Body() createReplyDto: CreateReplyDto) {
        return await this.reviewService.createReply(createReplyDto, user.id);
    }

    // @Patch(":review_id")
    // async updateReview(@User() user: UserInterface, @Param("review_id") reviewId: number, @Body() updateReviewDto: UpdateReviewDto) {
    //     return await this.reviewService.updateReview(updateReviewDto, user.id, reviewId);
    // }

    // @Patch("reply/:reply_id")
    // async updateReply(@User() user: UserInterface, @Param("reply_id") replyId: number, @Body() body: { reply: string }) {
    //     return await this.reviewServie.updateReply(replyId, body.reply, user.id);
    // }

    @Delete(':review_id')
    async deleteReview(@User() user: UserInterface, @Param('review_id') reviewId: number) {
        return await this.reviewService.deleteReview(reviewId, user.id);
    }

    @Delete('reply/:reply_id')
    async deleteReply(@User() user: UserInterface, @Param('reply_id') replyId: number) {
        return await this.reviewService.deleteReply(replyId, user.id);
    }

    @Public()
    @Get('overview/:product_id')
    async getReviewOverview(@Param('product_id') productId: number) {
        return await this.reviewService.getReviewOverview(productId);
    }

    @Roles([UserRole.FARMER])
    @Post('approve/:review_id')
    async approveReview(@Param('review_id') review_id: number, @Body() body: { approve: boolean }) {
        return await this.reviewService.approveReview(review_id, body.approve);
    }

    @Public()
    @Get('product/:product_id')
    async getReviews(@Param('product_id') productId: number, @Query() getReviewDto: GetReviewsDto) {
        return await this.reviewService.getProductReviewsByCursor(productId, getReviewDto);
    }
}
