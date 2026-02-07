import { Expose } from "class-transformer";

export class FarmTransparencyMetricsDto {
    @Expose() process_transparency: number;
    @Expose() customer_trust_score: number;

    @Expose() total: number;
}