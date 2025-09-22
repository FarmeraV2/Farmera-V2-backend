import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, IsOptional, IsInt } from 'class-validator';

export class CreateSubcategoryDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @Transform(({ value }) => parseInt(value))
    @IsInt()
    category_id: number;
}