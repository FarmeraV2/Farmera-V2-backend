import { IsNotEmpty, IsString, Length } from "class-validator";

export class CreateTemplateDto {
    @IsString()
    @IsNotEmpty()
    @Length(1, 70)
    name: string;

    @IsString()
    @IsNotEmpty()
    @Length(1, 70)
    subject: string;

    @IsString()
    @IsNotEmpty()
    content: string;
}