import { Address } from "web3";

export interface AuditorInfo {
    isActive: boolean;
    auditorAddress: Address;
    reputationScore: number;
    stakedTokens: string;
    name: string;
}

export interface VerificationRecord {
    isValid: boolean;
    auditor: Address;
    timestamp: number;
}