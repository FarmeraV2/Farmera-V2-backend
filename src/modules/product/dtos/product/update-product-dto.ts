import { Transform, Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class UpdateProductDto {
    @IsString()
    product_name: string;

    @IsString()
    description: string;

    @IsNotEmpty()
    @IsString()
    @Transform(({ value }) => BigInt(value))
    price_per_unit: bigint;

    @IsString()
    unit: string;

    @Type(() => Number)
    @IsNumber()
    @IsPositive()
    stock_quantity: number;

    @Type(() => Number)
    @IsNumber()
    @IsPositive()
    weight_per_unit: number;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    image_urls?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    video_urls?: string[];
}
