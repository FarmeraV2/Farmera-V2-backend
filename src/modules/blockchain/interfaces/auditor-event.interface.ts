import { Address } from "web3";

export interface AuditorRegistered {
    auditor: Address;
    name: string;
    stakedTokens: string;
}

export interface VerificationSubmitted {
    identifier: string;
    id: number;
    auditor: Address;
    isValid: boolean;
}

export interface VerificationFinalized {
    identifier: string;
    id: number;
    consensus: boolean;
    blockNumber: number;
}

export interface VerificationRequested {
    identifier: string;
    id: number;
    assignedAuditors: Address[];
    deadline: number;
    blockNumber: number;
}

export interface AuditorSlashed {
    auditor: Address;
    amount: string;
}