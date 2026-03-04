import { IsNumber, IsPositive } from "class-validator";

export class InactiveLogDto {
    @IsNumber()
    @IsPositive()
    log_id: number;

    @IsNumber()
    @IsPositive()
    season_step_id: number;
}