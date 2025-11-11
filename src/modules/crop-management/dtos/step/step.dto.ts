import { Expose, Type } from "class-transformer";
import { StepStatus } from "../../enums/step-status.enum";
import { CropType } from "../../enums/crop-type.enum";
import { StepType } from "../../enums/step-type.enum";
import { StepEvaluation } from "../../enums/step-evaluation";

export class StepDto {
    @Expose() id: number;
    @Expose() step_status: StepStatus;
    @Expose() step_evaluation?: StepEvaluation
    @Expose() season_id: number;
    @Expose() step_id: number;
    @Expose() step_name: string;
    @Expose() step_description: string;
    @Expose() step_notes?: string;
    @Expose() step_for_crop_type: CropType;
    @Expose() step_type: StepType;
    @Expose() created: Date;
    @Expose() updated: Date;
}

export class PublicStepDto {
    @Expose() id: number;
    @Expose() name: string;
    @Expose() description: string;
    @Expose() for_crop_type: CropType;
    @Expose() order: number;
    @Expose() repeated: boolean;
    @Expose() is_optional: boolean;
    @Expose() min_logs: number;
    @Expose() type: StepType;
}