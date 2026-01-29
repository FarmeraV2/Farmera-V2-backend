import { Expose, Type } from "class-transformer";
import { StepStatus } from "../../enums/step-status.enum";
import { CropType } from "../../enums/crop-type.enum";
import { StepType } from "../../enums/step-type.enum";
import { StepEvaluation } from "../../enums/step-evaluation";

// step in season detail table
export class StepDto {
    @Expose() id: number;
    @Expose() season_id: number;
    @Expose() step_id: number;
    // from step table
    @Expose() step_name: string;
    @Expose() step_description: string;
    @Expose() step_type: StepType;
    @Expose() step_order: number;
    // from season_detail table
    @Expose() step_status: StepStatus;
    @Expose() step_evaluation?: StepEvaluation
    @Expose() step_notes?: string;
    @Expose() transaction_hash?: string;
    @Expose() verified?: boolean;
    @Expose() created: Date;
    @Expose() updated: Date;
}

// step for selection
export class PublicStepDto {
    @Expose() id: number;
    @Expose() name: string;
    @Expose() description: string;
    @Expose() order: number;
    @Expose() repeated: boolean;
    @Expose() is_optional: boolean;
    @Expose() min_logs: number;
    @Expose() type: StepType;
}