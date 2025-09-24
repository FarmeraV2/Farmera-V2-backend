import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { CursorPaginationOptions } from 'src/common/dtos/pagination/cursor-pagination-option.dto';
import { ReviewSortField } from '../../enums/review-sort-fields.enum';

export class GetReviewsDto extends CursorPaginationOptions {
    @IsOptional()
    @IsEnum(ReviewSortField)
    sort_by: ReviewSortField = ReviewSortField.CREATED;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(5)
    @Type(() => Number)
    rating_filter?: number;
}