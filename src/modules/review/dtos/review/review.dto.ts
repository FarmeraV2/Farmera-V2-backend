import { Expose, Type } from "class-transformer";
import { PublicUserDto } from "src/modules/user/dtos/user/user.dto";

export class ReplyDto {
    @Expose() id: number;
    @Expose() reply: string;
    @Expose() created: Date;
    @Expose()
    @Type(() => PublicUserDto)
    user: PublicUserDto;
}

export class ReviewDto {
    @Expose() review_id: number;
    @Expose() rating: number;
    @Expose() content: string;
    @Expose() image_urls: string[] | null;
    @Expose() video_urls: string[] | null;
    @Expose() seller_approved: boolean;
    @Expose() created: Date;
    @Expose() product_id: number;

    @Expose()
    @Type(() => PublicUserDto)
    user: PublicUserDto;

    @Expose()
    @Type(() => ReplyDto)
    replies: ReplyDto[];
}

const replyDtoProps = Object.keys(new ReplyDto());
export const replySelectFields = replyDtoProps
    .map((prop) => {
        if (prop === 'user') return null;
        return `reply.${prop}`;
    })
    .filter((field): field is string => !!field);

const reviewDtoProps = Object.keys(new ReviewDto());
export const reviewSelectFields = reviewDtoProps
    .map((prop) => {
        if (prop === 'user' || prop === 'replies') return null;
        return `review.${prop}`;
    })
    .filter((field): field is string => !!field);