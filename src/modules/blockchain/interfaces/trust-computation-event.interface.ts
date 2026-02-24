export interface TrustProcessedEvent {
    identifier: string,
    id: number,
    accept: boolean,
    trustScore: number,
}