import { Type } from "class-transformer";
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class UpdatePlotDto {
    @IsNumber()
    @IsPositive()
    @Type(() => Number)
    id: number;

    @IsString()
    @IsNotEmpty()
    plot_name: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    notes?: string;
}