import { IsEnum } from "class-validator";
import { StepEvaluation } from "../../enums/step-evaluation";

export class UpdateStepEvaluation {
    @IsEnum(StepEvaluation)
    evaluation: StepEvaluation;
}