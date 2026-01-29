import { IsNotEmpty, IsNumber, IsObject, IsOptional, IsPositive, IsString, ValidateNested } from "class-validator";
import { LocationRequestDto } from "src/common/dtos/location/location.dto";
import { Type } from "class-transformer";

export class CreatePlotDto {
    @IsString()
    @IsNotEmpty()
    plot_name: string;

    @IsString()
    @IsNotEmpty()
    crop_name: string;

    @IsOptional()
    @IsNumber()
    @IsPositive()
    area?: number;

    @IsObject()
    @Type(() => LocationRequestDto)
    @ValidateNested()
    location: LocationRequestDto;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    notes?: string;

    @IsString()
    @IsNotEmpty()
    image_url: string;

    @IsNumber()
    @IsPositive()
    crop_id: number;
}