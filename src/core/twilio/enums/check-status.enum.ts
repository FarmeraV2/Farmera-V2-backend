export enum CheckStatus {
    PENDING = "pending",
    APPROVED = "approved",
    CANCELED = "canceled",
    MAX_ATTEMPTS_REACHED = "max_attempts_reached",
    DELETED = "deleted",
    FAILED = "failed",
    EXPIRED = "expired",
}

// export const parseCheckStatus = (value: string): CheckStatus => {
//     if (Object.values(CheckStatus).includes(value as unknown as CheckStatus)) {
//         return value as unknown as CheckStatus;
//     }
//     throw new Error(`Invalid CheckStatus value: ${value}`);
// }
