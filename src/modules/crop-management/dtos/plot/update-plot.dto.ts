import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpdatePlotDto {
    @IsString()
    @IsNotEmpty()
    plot_name: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    notes?: string;
}