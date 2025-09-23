export enum FarmStatus {
    UNSPECIFIED = 'UNSPECIFIED',
    PENDING = 'PENDING',
    VERIFIED = 'VERIFIED', // verified biometric
    APPROVED = 'APPROVED', // admin approved
    BLOCKED = 'BLOCKED',
    REJECTED = 'REJECTED',
}