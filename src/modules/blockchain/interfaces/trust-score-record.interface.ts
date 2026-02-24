export interface TrustRecord {
    identifier: string,
    id: number,
    accept: boolean,
    trustScore: number,
    timestamp: Date
}