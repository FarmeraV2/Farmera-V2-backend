import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { CropType } from "../../enums/crop-type.enum";
import { LocationDto } from "src/common/dtos/location/location.dto";
import { Type } from "class-transformer";

export class CreatePlotDto {
    @IsString()
    @IsNotEmpty()
    plot_name: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    notes?: string;
}