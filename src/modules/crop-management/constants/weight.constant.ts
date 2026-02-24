// Step-level metrics weights (sum = 1.0)
export const W_ST_DOC_COMPLETENESS: number = 0.50;
export const W_ST_VERIFICATION_RATIO: number = 0.35;
export const W_ST_TEMPORAL_REGULARITY: number = 0.15;

// Season-level geometric mean exponents (sum = 1.0)
export const W_SS_PROCESS: number = 0.65;
export const W_SS_TEMPORAL: number = 0.20;
export const W_SS_OUT_COME: number = 0.15;

// Step type weights (sum = 1.0)
export const W_ST_TYPE_PREPARE: number = 0.1;
export const W_ST_TYPE_PLANTING: number = 0.1;
export const W_ST_TYPE_CARE: number = 0.5;
export const W_ST_TYPE_HARVEST: number = 0.2;
export const W_ST_TYPE_POST_HARVEST: number = 0.1;

// Farm-level Bayesian Beta parameters
export const BAYESIAN_PRIOR_ALPHA: number = 2;
export const BAYESIAN_PRIOR_BETA: number = 2;
export const BAYESIAN_N_EFF: number = 5;

// Verification
export const DEFAULT_UNVERIFIED_DISCOUNT: number = 0.7;

// Temporal sigmoid parameters
export const TEMPORAL_SIGMOID_K: number = 0.3;
export const TEMPORAL_SIGMOID_MIDPOINT: number = 14; // days
