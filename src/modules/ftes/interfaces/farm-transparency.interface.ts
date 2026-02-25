// ─── Audit Integrity (AI) ─────────────────────────────────────────────────────
// Geometric mean of on-chain log trust scores — Saaty (1980); UNDP HDI (2010)
// T_farm = exp( (1/N) × Σ ln(max(sᵢ, ε)) ),  sᵢ = trust_score_i / 100 ∈ [0,1]
export interface FarmTransparencyScore {
    score: number;          // T_farm ∈ [0, 1]  (geometric mean of normalized trust scores)
    total_evidence: number; // N = total on-chain audited logs
}

export interface FarmOverallScore {
    total: number;
    transparency: number;
    order_fulfillment: number | null;
    market_validation: number | null;
}
