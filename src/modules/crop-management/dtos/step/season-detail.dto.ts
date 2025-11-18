import { Expose } from "class-transformer";
import { StepEvaluation } from "../../enums/step-evaluation";
import { StepStatus } from "../../enums/step-status.enum";

export class SeasonDetailDto {
    @Expose() season_id: number;
    @Expose() step_id: number;
    @Expose() step_status: StepStatus;
    @Expose() step_evaluation: StepEvaluation
    @Expose() created: Date;
}