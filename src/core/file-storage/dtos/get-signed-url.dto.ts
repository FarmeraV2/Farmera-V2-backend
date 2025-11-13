import { IsNotEmpty, IsString } from "class-validator";

export class GetSignedUrlDto {
    @IsString()
    @IsNotEmpty()
    key: string;
}