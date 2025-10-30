import { IsDateString, IsNumber, IsOptional, IsPositive, IsTimeZone } from "class-validator";

export class UpdateUserPreferenceDto {
    @IsNumber()
    @IsPositive()
    id: number;

    @IsOptional()
    @IsDateString()
    do_not_disturb_start?: string

    @IsOptional()
    @IsDateString()
    do_not_disturb_end?: string

    @IsTimeZone()
    time_zone: string

    @IsNumber()
    @IsPositive()
    user_id: number
}