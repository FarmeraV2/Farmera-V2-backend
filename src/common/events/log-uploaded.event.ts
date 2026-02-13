export class LogUploadedEvent {
    static readonly name = 'log.uploaded';

    constructor(
        public readonly id: number,
        public readonly transactionHash: string
    ) { }
}