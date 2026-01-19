import { Transform, Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreateProductDto {
    @IsNotEmpty()
    @IsString()
    product_name: string;

    @IsNotEmpty()
    @IsString()
    description: string;

    @IsNotEmpty()
    @IsString()
    // @Transform(({ value }) => BigInt(value))
    price_per_unit: bigint;

    @IsNotEmpty()
    @IsString()
    unit: string;

    @IsNotEmpty()
    @Type(() => Number)
    @IsNumber()
    @IsPositive()
    weight_per_unit: number;

    @IsNotEmpty()
    @Type(() => Number)
    @IsNumber()
    @IsPositive()
    stock_quantity: number;

    @IsArray()
    @ArrayNotEmpty()
    @IsOptional()
    subcategory_ids?: number[];

    @IsArray()
    @IsOptional()
    @IsString({ each: true })
    image_urls?: string[];

    @IsArray()
    @IsOptional()
    @IsString({ each: true })
    video_urls?: string[];
}
