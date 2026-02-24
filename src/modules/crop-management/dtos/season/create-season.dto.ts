import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString } from "class-validator";

export class CreateSeasonDto {
    @IsInt()
    @IsPositive()
    plot_id: number;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    image_url?: string;

    @IsDateString()
    @IsNotEmpty()
    start_date: Date;

    @IsDateString()
    @IsNotEmpty()
    expected_end_date: Date;

    @IsInt()
    @IsPositive()
    expected_yield: number;

    @IsString()
    @IsNotEmpty()
    yield_unit: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    notes?: string;
}