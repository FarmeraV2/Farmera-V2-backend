import { IsNotEmpty, IsOptional, IsString, Length } from "class-validator";

export class UpdateTemplateDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @Length(1, 70)
    name?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @Length(1, 70)
    subject?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    content?: string;
}