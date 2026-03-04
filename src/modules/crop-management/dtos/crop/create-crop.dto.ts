import { IsArray, IsEnum, IsNotEmpty, IsString } from "class-validator";
import { CropType } from "../../enums/crop-type.enum";

export class CreateCropDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEnum(CropType)
    crop_type: CropType;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsArray()
    @IsString({ each: true })
    image_urls?: string[];
}