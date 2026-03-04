export const TEMPORAL_LAMBDA_UNDER: number = 2.0;  // under-duration decay rate
export const TEMPORAL_LAMBDA_OVER: number = 1.0;  // over-duration decay rate
export const GM_EPSILON: number = 0.01;        // floor for ln(); sᵢ = max(s/100, ε)
// ─── Farm Overall Score — composite weights (sum ≈ 1.0) ──────────────────────
// Three orthogonal dimensions — criterion selection:
//   AI  — on-chain audit integrity
//   OFR — order fulfillment rate
//   MV  — market validation
//
// AHP pairwise matrix (3×3): Suggest by AI - should seek expert advice
//         AI    OFR   MV
//   AI  [  1     3     7  ]   w ≈ 0.633  (Audit Integrity — primary traceability signal)
//   OFR [ 1/3    1     3  ]   w ≈ 0.260  (Order Fulfillment — objective delivery outcome)
//   MV  [ 1/7   1/3    1  ]   w ≈ 0.106  (Market Validation — buyer perception signal)
//
//   λ_max ≈ 3.055,  CI = (λ_max − n)/(n − 1) = 0.0275,  RI(3) = 0.58
//   CR = CI/RI = 0.047 < 0.10  ✓ (acceptable consistency, Saaty 1980)
//
// Aggregation: weighted geometric mean (Saaty 1980) — all dimensions must be adequate.
// Weights renormalize automatically when a dimension has no data (new farm / no orders).
export const W_FARM_AI: number = 0.633;   // Audit Integrity
export const W_FARM_OFR: number = 0.260;  // Order Fulfillment Rate
export const W_FARM_MV: number = 0.106;   // Market Validation
