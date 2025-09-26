import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateReviewDto {
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(5)
    rating: number;

    @IsString()
    @IsNotEmpty()
    comment: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    image_urls?: string[];

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    video_urls?: string[];
}
