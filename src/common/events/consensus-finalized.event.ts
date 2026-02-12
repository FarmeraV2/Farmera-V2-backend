export class ConsensusFinalizedEvent {
    static readonly eventName = 'consensus.finalized';

    constructor(
        public readonly requestId: number,
        public readonly logId: number,
        public readonly seasonDetailId: number,
        public readonly consensus: boolean,
        public readonly consensusWeight: number,
    ) {}
}
