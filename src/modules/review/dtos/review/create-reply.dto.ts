import { Type } from "class-transformer";
import { IsNotEmpty, IsNumber, IsPositive, IsString } from "class-validator";

export class CreateReplyDto {
    @Type(() => Number)
    @IsNumber()
    @IsPositive()
    review_id: number;

    @IsString()
    @IsNotEmpty()
    reply: string;
}