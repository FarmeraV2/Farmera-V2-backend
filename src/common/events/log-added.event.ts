import { Log } from 'src/modules/crop-management/entities/log.entity';

export class LogAddedEvent {
    static readonly name = 'log.added';

    constructor(
        public readonly log: Log,
        public readonly farmId: number,
    ) { }
}
