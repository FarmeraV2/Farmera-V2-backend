/**
 * FTES Scoring Constants
 *
 * All weights are derived from the Analytic Hierarchy Process (AHP).
 * Reference: Saaty, T.L. (1977, 1980).
 *
 * Criterion selection:
 * - Log/Step level: Wang & Strong (1996) data quality dimensions
 * - Farm level:     Geometric mean of on-chain trust scores (Saaty 1980; UNDP HDI 2010)
 *
 * Full derivation: claude/FTES_SCORING_ACADEMIC_FRAMEWORK.md
 */

// ─── Step score = Log trust score (Tier 2 → Tier 1) ──────────────────────────
// StepTrustPackage.sol is removed (step formula redundant with n=1 log per step).
// Each step's transparency_score is set directly from the log's on-chain trust score
// (LogDefaultPackage or LogAuditorPackage), normalized from [0–100] to [0–1].

// ─── Farm-level Geometric Mean parameters ─────────────────────────────────────
// Basis: Geometric mean of on-chain log trust scores (Saaty 1980; UNDP HDI 2010)
// T_farm = exp( (1/N) × Σ ln(max(sᵢ, ε)) ),  sᵢ = trust_score_i / 100 ∈ [0,1]
// ε prevents ln(0); k is prior weight for confidence estimate N/(N+k).
export const GM_EPSILON: number = 0.01;        // floor for ln(); sᵢ = max(s/100, ε)

// ─── Farm Overall Score — composite weights (sum ≈ 1.0) ──────────────────────
// Three orthogonal dimensions — criterion selection:
//   AI  — on-chain audit integrity (Golan et al. 2004 — Depth/Precision; Saaty 1980)
//   OFR — order fulfillment rate   (Dickson 1966 — Delivery criterion, supplier evaluation)
//   MV  — market validation        (Parasuraman et al. 1988 SERVQUAL — Reliability/Assurance)
//
// AHP pairwise matrix (3×3) — Saaty (1980):
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

// ─── Temporal gap parameters (SelectiveTransparencyService — CR detection) ────
// Basis: Cui et al. (2024) [P2] — temporal gap as selective omission signal
export const GAP_PENALTY_K: number = 0.3;
export const GAP_THRESHOLD_MULTIPLIER: number = 3;

// ─── Commit-reveal deadlines ──────────────────────────────────────────────────
export const COMMIT_PHASE_DAYS: number = 5;
export const REVEAL_PHASE_DAYS: number = 2;
