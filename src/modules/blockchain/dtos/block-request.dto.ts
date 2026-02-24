import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsPositive, Min } from "class-validator";

export class BlockRequest {
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    from: number = 0;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    to?: number;
}