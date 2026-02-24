import { Type } from "class-transformer";
import { IsDateString, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class UpdateSeasonDto {
    @IsNumber()
    @IsPositive()
    @Type(() => Number)
    id: number;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsDateString()
    @IsNotEmpty()
    start_date: Date;

    @IsDateString()
    @IsNotEmpty()
    expected_end_date: Date;

    @IsInt()
    @IsPositive()
    expected_yield: number;

    @IsOptional()
    @IsInt()
    @IsPositive()
    actual_yield?: number;

    @IsString()
    @IsNotEmpty()
    yield_unit: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    notes?: string;
}

export class UpdateFinishSeasonDto {
    @IsInt()
    @IsPositive()
    actual_yield: number;
}