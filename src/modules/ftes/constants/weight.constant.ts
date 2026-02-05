// Step-level metrics weights (sum = 1.0)
export const W_ST_LOG_COVERAGE: number = 0.6;
export const W_ST_ACTIVITY_RATIO: number = 0.4;
// export const W_ST_DATA_QUALITY: number = 0.2;
// export const W_ST_TIMELINESS: number = 0.15;
// export const W_ST_DOCUMENTATION: number = 0.15;

export const W_SS_PROCESS: number = 0.60;
export const W_SS_TEMPORAL: number = 0.20;
export const W_SS_OUT_COME: number = 0.20;

// Step type weights (sum = 1.0)
export const W_ST_TYPE_PREPARE: number = 0.1;
export const W_ST_TYPE_PLANTING: number = 0.1;
export const W_ST_TYPE_CARE: number = 0.5;
export const W_ST_TYPE_HARVEST: number = 0.2;
export const W_ST_TYPE_POST_HARVEST: number = 0.1;

// Farm
export const W_FARM_PROCESS: number = 0.60;
export const W_FARM_CUSTOMER_TRUST: number = 0.40;