export class LogVerified {
    static readonly name = 'log.verified';

    constructor(
        public readonly id: number,
        public readonly consensus: boolean,
        public readonly totalVote: number,
    ) { }
}