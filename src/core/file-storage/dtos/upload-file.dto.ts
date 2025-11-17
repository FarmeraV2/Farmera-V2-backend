import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { MediaGroupType } from "../enums/media-group-type.enum";

export class UploadFileDto {
    @IsEnum(MediaGroupType)
    group_type: MediaGroupType;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    sub_path?: string;
}