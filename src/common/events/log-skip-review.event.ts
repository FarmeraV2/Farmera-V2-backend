import { Log } from 'src/modules/crop-management/entities/log.entity';

export class LogSkipReviewEvent {
    static readonly name = 'log.skip-review';

    constructor(
        public readonly log: Log,
    ) { }
}
