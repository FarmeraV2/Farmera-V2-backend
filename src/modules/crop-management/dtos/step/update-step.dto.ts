import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";
import { StepType } from "../../enums/step-type.enum";
import { Type } from "class-transformer";

export class UpdateStepDto {
    @IsNumber()
    @Type(() => Number)
    step_id: number;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    notes?: string;

    @IsNumber()
    @IsPositive()
    order: number;

    @IsOptional()
    @IsBoolean()
    repeated?: boolean;

    @IsOptional()
    @IsBoolean()
    is_optional: boolean;

    @IsNumber()
    @IsPositive()
    min_logs: number;

    @IsEnum(StepType)
    type: StepType;

    @IsOptional()
    @IsNumber()
    @IsPositive()
    min_day_duration: number;

    @IsOptional()
    @IsNumber()
    @IsPositive()
    max_day_duration: number;
}