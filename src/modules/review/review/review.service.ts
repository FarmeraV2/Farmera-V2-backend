import { BadRequestException, HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from "typeorm";
import { Review } from '../entities/review.entity';
import { CreateReviewDto } from '../dtos/review/create-review.dto';
import { Reply } from '../entities/reply.entity';
import { CreateReplyDto } from '../dtos/review/create-reply.dto';
import { plainToInstance } from 'class-transformer';
import { CursorPaginationTransform } from 'src/common/dtos/pagination/cursor-pagination-option.dto';
import { GetReviewsDto } from '../dtos/review/get-review.dto';
import { ReviewSortField } from '../enums/review-sort-fields.enum';
import { CursorPaginationResult } from 'src/common/dtos/pagination/cursor-pagination-result.dto';
import { RatingStatsDto } from '../dtos/review/rating-stats.dto';

@Injectable()
export class ReviewService {
    private readonly logger = new Logger(ReviewService.name);

    constructor(
        @InjectRepository(Review) private readonly reviewRepository: Repository<Review>,
        @InjectRepository(Reply) private readonly replyRepository: Repository<Reply>,
        // private readonly fileStorageService: AzureBlobService,
    ) { }

    async createReview(createReviewDto: CreateReviewDto, userId: number): Promise<Review> {
        try {
            // todo!("check if user has purchased the product")
            const orderDetailId = 0;

            const review = this.reviewRepository.create(createReviewDto);
            review.user_id = userId;
            // review.order_detailId = orderDetailId;

            return await this.reviewRepository.save(review);
        } catch (error) {
            this.logger.error(error.message);
            throw new InternalServerErrorException(`Failed to create review`);
        }
    }

    async createReply(createReplyDto: CreateReplyDto, userId: number): Promise<Reply> {
        try {
            const review = await this.reviewRepository.exists({
                where: { review_id: createReplyDto.review_id, is_deleted: false }
            });
            if (review) {
                const reply = this.replyRepository.create(createReplyDto);
                reply.review_id = createReplyDto.review_id;
                reply.user_id = userId;
                return await this.replyRepository.save(reply);
            }
            throw new NotFoundException("Review not found");
        }
        catch (error) {
            this.logger.error(error.message);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException(`Failed to create reply`);
        }
    }

    async getProductReviewsByCursor(productId: number, getReviewDto: GetReviewsDto) {
        // extract pagination options
        const paginationOptions = plainToInstance(CursorPaginationTransform<ReviewSortField>, getReviewDto);
        const { limit, sort_by, order, cursor } = paginationOptions;
        const { rating_filter } = getReviewDto;

        // build query
        const qb = this.reviewRepository.createQueryBuilder('review')
            .where('review.is_deleted = false')
            .leftJoinAndSelect('review.replies', 'reply', 'reply.is_deleted = false')
            .andWhere('review.product_id = :productId', { productId })
            .take(limit);

        if (sort_by === ReviewSortField.CREATED) {
            qb.orderBy('review.review_id', order);
        } else {
            qb.orderBy('review.rating', order).addOrderBy('review.review_id', order);
        }

        if (rating_filter) {
            qb.andWhere('review.rating = :rating', { rating: rating_filter });
        }

        if (cursor) {
            const decoded = this.decodeCursor(cursor);
            if (sort_by === ReviewSortField.CREATED) {
                if (order === 'DESC') {
                    qb.andWhere('review.review_id < :decoded', { decoded });
                } else {
                    qb.andWhere('review.review_id > :decoded', { decoded });
                }
            } else {
                // cursor: "<rating>_<id>"
                const [ratingStr, review_id] = decoded.split('_');
                const rating = parseInt(ratingStr);

                if (order === 'DESC') {
                    qb.andWhere('(review.rating < :rating OR (review.rating = :rating AND review.review_id < :review_id))', {
                        rating,
                        review_id,
                    });
                } else {
                    qb.andWhere('(review.rating > :rating OR (review.rating = :rating AND review.review_id > :review_id))', {
                        rating,
                        review_id,
                    });
                }
            }
        }

        const reviews = await qb.getMany();

        // create next cursor
        let nextCursor: string | null = null;
        if (reviews.length === limit) {
            const lastReview = reviews[reviews.length - 1];
            if (sort_by === ReviewSortField.CREATED) {
                nextCursor = lastReview.review_id.toString();
            } else {
                nextCursor = `${lastReview.rating}_${lastReview.review_id.toString()}`;
            }
        }

        if (nextCursor) {
            nextCursor = this.encodeCursor(nextCursor);
        }

        return new CursorPaginationResult(reviews, { next_cursor: nextCursor })
    }

    async deleteReview(reviewId: number, userId: number): Promise<boolean> {
        try {
            const result = await this.reviewRepository.update({ review_id: reviewId, user_id: userId }, { is_deleted: true });
            if (result.affected === 0) {
                throw new InternalServerErrorException(`Failed to delete review`);
            }
            return true;
        }
        catch (err) {
            this.logger.error(err.message);
            if (err instanceof HttpException) throw err;
            throw new InternalServerErrorException("Failed to delete review");
        }
    }

    async deleteReply(replyId: number, userId: number) {
        try {
            const result = await this.replyRepository.update({ id: replyId, user_id: userId }, { is_deleted: true });
            if (result.affected == 0) {
                throw new InternalServerErrorException(`Failed to delete reply`);
            }
            return true;
        }
        catch (err) {
            this.logger.error(err.message);
            if (err instanceof HttpException) throw err;
            throw new InternalServerErrorException("Failed to delete reply");
        }
    }

    async approveReview(reviewId: number, approve: boolean) {
        try {
            const result = await this.reviewRepository.update({ review_id: reviewId }, { seller_approved: approve });
            if (result.affected == 0) {
                throw new InternalServerErrorException(`Approve failed`);
            }
            return true
        }
        catch (err) {
            this.logger.error(err.message);
            if (err instanceof HttpException) throw err;
            throw new InternalServerErrorException("Approve failed");
        }
    }

    // todo!("build a ssis")
    async getReviewOverview(productId: number): Promise<RatingStatsDto> {
        const ratings = await this.reviewRepository.createQueryBuilder('review')
            .select('review.rating', 'rating')
            .addSelect('review.rating', 'rating')
            .addSelect('COUNT(*)', 'count')
            .where('review.is_deleted = false')
            .andWhere('review.product_id = :productId', { productId })
            .groupBy('review.rating')
            .getRawMany();

        const counts: Record<number, number> = {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0,
        };

        for (const row of ratings) {
            const rating = Number(row.rating);
            const count = Number(row.count);
            counts[rating] = count;
        }
        return new RatingStatsDto(counts);
    }

    // async updateReview(reviewId: number, updateReviewDto: UpdateReviewDto, userId: string) {
    //     try {
    //         const existingReview = await this.reviewRepository.findOneBy({
    //             review_id: reviewId,
    //             user_id: userId,
    //         });


    //         if (!existingReview) {
    //             throw new NotFoundException('Không tìm thấy review');
    //         }

    //         const deleteImgUrls = existingReview.image_urls?.filter((value) => !updateReviewDto.image_urls?.includes(value));
    //         const deleteVideoUrls = existingReview.video_urls?.filter((value) => !updateReviewDto.video_urls?.includes(value));

    //         const failedDeletes: string[] = [];

    //         // delete images
    //         if (deleteImgUrls?.length) {
    //             const imgResults = await Promise.allSettled(
    //                 deleteImgUrls.map((url) => this.fileStorageService.deleteFile(url))
    //             );

    //             imgResults.forEach((result, index) => {
    //                 if (result.status === 'rejected') {
    //                     this.logger.error(`Failed to delete image: ${deleteImgUrls[index]}`);
    //                     failedDeletes.push(deleteImgUrls[index]);
    //                 }
    //             });
    //         }

    //         // delete videos
    //         if (deleteVideoUrls?.length) {
    //             const videoResults = await Promise.allSettled(
    //                 deleteVideoUrls.map((url) => this.fileStorageService.deleteFile(url))
    //             );

    //             videoResults.forEach((result, index) => {
    //                 if (result.status === 'rejected') {
    //                     this.logger.error(`Failed to delete video: ${deleteVideoUrls[index]}`);
    //                     failedDeletes.push(deleteVideoUrls[index]);
    //                 }
    //             });
    //         }

    //         existingReview.rating = updateReviewDto.rating;
    //         existingReview.comment = updateReviewDto.comment;
    //         existingReview.image_urls = updateReviewDto.image_urls ? updateReviewDto.image_urls : null;
    //         existingReview.video_urls = updateReviewDto.video_urls ? updateReviewDto.video_urls : null;

    //         const result = await this.reviewRepository.save(existingReview);

    //         return result;

    //     } catch (error) {
    //         this.logger.error(error.message);
    //         if (error instanceof NotFoundException) {
    //             throw error;
    //         }
    //         throw new InternalServerErrorException(`Không cập nhật thể đánh giá`);
    //     }
    // }

    // async updateReply(replyId: number, reply: string, userId: string) {
    //     const result = await this.replyRepository.findOne({ where: { id: replyId, user_id: userId } });
    //     if (!result) {
    //         throw new NotFoundException(`Không tìm thấy reply`);
    //     }
    //     result.reply = reply;
    //     return await this.replyRepository.save(result);
    // }

    /*#########################################################################
                               Private functions                             
    #########################################################################*/

    private encodeCursor(payload: string): string {
        return Buffer.from(payload).toString('base64');
    }

    private decodeCursor(cursor: string): string {
        try {
            return Buffer.from(cursor, 'base64').toString('utf8');
        } catch (err) {
            throw new BadRequestException('Invalid cursor');
        }
    }
}
