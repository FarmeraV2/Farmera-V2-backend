import { IsNumber, IsPositive } from "class-validator";

export class AddStepDto {
    @IsNumber()
    @IsPositive()
    season_id: number;

    @IsNumber()
    @IsPositive()
    step_id: number;
}