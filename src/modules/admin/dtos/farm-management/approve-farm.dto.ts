import { IsNumber, IsPositive } from "class-validator";

export class ApproveFarmDto {
    @IsNumber()
    @IsPositive()
    farm_id: number;

    @IsNumber()
    @IsPositive()
    user_id: number;
}