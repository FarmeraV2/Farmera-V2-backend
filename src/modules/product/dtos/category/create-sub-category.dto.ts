import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, IsOptional, IsInt } from 'class-validator';

export class CreateSubcategoryDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @Type(() => Number)
    @IsInt()
    category_id: number;
}
