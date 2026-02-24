import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { MediaGroupType } from "../enums/media-group-type.enum";

export class UploadFileDto {
    @IsEnum(MediaGroupType)
    group_type: MediaGroupType;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    sub_path?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    file_key?: string;

    get key(): string {
        if (this.file_key) {
            let path = `${this.group_type}`;
            if (this.sub_path) path += `/${this.sub_path}`

            return `${path}/${this.file_key}`;
        }

        return this.sub_path
            ? `${this.group_type}/${this.sub_path}`
            : `${this.group_type}`;
    }
}