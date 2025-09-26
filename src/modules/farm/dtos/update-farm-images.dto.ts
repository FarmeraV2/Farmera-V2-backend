import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateFarmImagesDto {
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    profile_image_urls?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    certificate_image_urls?: string[];
}

export class UpdateFarmAvatarDto {
    @IsString()
    avatar_url: string;
}
