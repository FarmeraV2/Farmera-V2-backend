import { IsDate, IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { Gender } from "../../enums/gender.enum";
import { Type } from "class-transformer";

export class UpdateProfileDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    first_name?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    last_name?: string;

    @IsOptional()
    @IsEnum(Gender)
    gender?: Gender;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    avatar?: string;

    @IsOptional()
    @IsDateString()
    @IsNotEmpty()
    birthday?: Date;
}