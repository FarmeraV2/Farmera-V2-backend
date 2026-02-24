import { IsNumber, IsPositive } from "class-validator";

export class AssignSeasonDto {
    @IsNumber()
    @IsPositive()
    season_id: number
}