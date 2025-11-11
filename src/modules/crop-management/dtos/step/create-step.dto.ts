import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";
import { CropType } from "../../enums/crop-type.enum";
import { StepType } from "../../enums/step-type.enum";

export class CreateStepDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    notes: string;

    @IsEnum(CropType)
    for_crop_type: CropType;

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
    parent_id?: number;
}