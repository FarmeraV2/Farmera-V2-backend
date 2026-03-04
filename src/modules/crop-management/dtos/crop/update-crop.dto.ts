import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class UpdateCropDto {
    @IsNumber()
    @Type(() => Number)
    crop_id: number;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsArray()
    @IsString({ each: true })
    image_urls?: string[];
}