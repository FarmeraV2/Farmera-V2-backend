import { Type } from "class-transformer";
import { IsBoolean, IsNumber, IsPositive } from "class-validator";

export class UpdatePreferenceChannelDto {
    @IsNumber()
    @IsPositive()
    channel_id: number;

    @IsBoolean()
    @Type(() => Boolean)
    active: boolean;
}