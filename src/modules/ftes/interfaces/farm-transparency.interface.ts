export interface FarmTransparencyScore {
    score: number;          // AI_farm ∈ [0, 1]  (penalized steps-weighted GM)
    total_evidence: number; // M_total = total scored steps across all seasons
}

export interface FarmOverallScore {
    total: number;
    transparency: number;
    order_fulfillment: number | null;
    market_validation: number | null;
}
