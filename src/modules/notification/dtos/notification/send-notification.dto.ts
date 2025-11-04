import { IsNotEmpty, IsNumber, IsPositive, IsString, Length } from "class-validator";

export class SendNotificationDto {
    @IsString()
    @IsNotEmpty()
    @Length(1, 70)
    subject: string;

    @IsString()
    @IsNotEmpty()
    content: string;

    @IsNumber()
    @IsPositive()
    channel_id: number;
}