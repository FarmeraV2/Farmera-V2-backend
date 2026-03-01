import { Expose } from "class-transformer";

export class HashedStep {
    @Expose() id: number;
    @Expose() season_id: number;
    @Expose() step_id: number;
    @Expose() created: Date;
    @Expose() transparency_score: number;
}