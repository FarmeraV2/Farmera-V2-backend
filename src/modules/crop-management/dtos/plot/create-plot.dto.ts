import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { CropType } from "../../enums/crop-type.enum";
import { LocationDto } from "src/common/dtos/location/location.dto";
import { Type } from "class-transformer";

export class CreatePlotDto {
    @IsString()
    @IsNotEmpty()
    plot_name: string;

    @IsString()
    @IsNotEmpty()
    crop_name: string;

    @IsEnum(CropType)
    crop_type: CropType;

    @IsNumber()
    @IsOptional()
    area?: number;

    @ValidateNested()
    @IsNotEmpty()
    @Type(() => LocationDto)
    location: LocationDto;

    @IsDateString()
    start_date: Date;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    notes?: string;
}