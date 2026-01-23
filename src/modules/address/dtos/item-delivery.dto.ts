import { Type } from "class-transformer";
import { IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator";

export class ItemDeliveryDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    code?: string;

    @Type(() => Number)
    @IsNotEmpty()
    quantity: number;

    @Type(() => Number)
    @IsOptional()
    height?: number;

    @Type(() => Number)
    @IsNotEmpty()
    weight: number;

    @Type(() => Number)
    @IsOptional()
    width?: number;

    @Type(() => Number)
    @IsOptional()
    length?: number;

    @Type(() => Number)
    @IsOptional()
    price?: number;

    @IsOptional()
    @ValidateNested()
    category?: CategoryDto;


}

export class CategoryDto { 
    @IsOptional()
    level1?: string;

    @IsOptional()
    level2?: string;

    @IsOptional()
    level3?: string;
}