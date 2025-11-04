import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString } from "class-validator";

export class UpdateSeasonDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsDateString()
    @IsNotEmpty()
    start_date: Date;

    @IsDateString()
    @IsNotEmpty()
    expected_end_date: Date;

    @IsOptional()
    @IsDateString()
    @IsNotEmpty()
    actual_end_date?: Date;

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