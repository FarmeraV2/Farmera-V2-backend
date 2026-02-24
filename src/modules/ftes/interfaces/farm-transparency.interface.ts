export interface FarmTransparencyMetrics {
    transparency: {
        score: number;
        confidence: number;
        seasons_evaluated: number;
    };
    customer_satisfaction: {
        score: number;
        review_count: number;
    };
    total: number;
}
