import { Log } from 'src/modules/crop-management/entities/log.entity';

export class LogInactiveEvent {
    static readonly name = 'log.inactive';

    constructor(
        public readonly log: Log,
        public readonly farmId: number,
    ) { }
}
