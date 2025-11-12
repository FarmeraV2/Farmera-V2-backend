import { IsNumber, IsPositive } from "class-validator";

export class addStepDto {
    @IsNumber()
    @IsPositive()
    step_id: number;
}