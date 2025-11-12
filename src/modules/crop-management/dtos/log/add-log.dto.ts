import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, ValidateNested } from "class-validator";
import { LocationRequestDto } from "src/common/dtos/location/location.dto";
import { LogType } from "../../enums/log-type.enum";

export class AddLogDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsOptional()
    @IsEnum(LogType)
    type: LogType;

    @IsArray()
    @ArrayMinSize(1)
    @IsString({ each: true })
    @IsNotEmpty({ each: true })
    image_urls: string[];

    @IsArray()
    @ArrayMinSize(1)
    @IsString({ each: true })
    @IsNotEmpty({ each: true })
    video_urls: string[];

    @IsObject()
    @Type(() => LocationRequestDto)
    @ValidateNested()
    location: LocationRequestDto;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    notes?: string;
}