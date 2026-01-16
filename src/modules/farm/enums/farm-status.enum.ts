export enum FarmStatus {
    UNSPECIFIED = 'UNSPECIFIED',
    PENDING = 'PENDING',
    VERIFIED = 'VERIFIED', // verified biometric
    PENDING_APPROVE = "PENDING_APPROVE",
    APPROVED = 'APPROVED', // admin approved
    BLOCKED = 'BLOCKED',
    REJECTED = 'REJECTED',
}
