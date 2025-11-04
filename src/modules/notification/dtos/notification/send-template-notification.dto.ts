import { IsNumber, IsObject, IsOptional, IsPositive } from "class-validator";

export class SendtemplateNotificationDto {
    @IsOptional()
    @IsObject()
    place_holder?: Record<string, string>

    @IsNumber()
    @IsPositive()
    channel_id: number;

    @IsNumber()
    @IsPositive()
    template_id: number;
}