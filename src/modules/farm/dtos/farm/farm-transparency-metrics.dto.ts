import { Expose, Type } from "class-transformer";

class TransparencyScoreDto {
    @Expose() score: number;
    @Expose() confidence: number;
    @Expose() seasons_evaluated: number;
}

class CustomerSatisfactionDto {
    @Expose() score: number;
    @Expose() review_count: number;
}

export class FarmTransparencyMetricsDto {
    @Expose()
    @Type(() => TransparencyScoreDto)
    transparency: TransparencyScoreDto;

    @Expose()
    @Type(() => CustomerSatisfactionDto)
    customer_satisfaction: CustomerSatisfactionDto;

    @Expose() total: number;
}
