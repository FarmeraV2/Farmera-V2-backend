export class StepFinishedEvent {
    static readonly eventName = 'step.finished';

    constructor(
        public readonly seasonDetailId: number,
        public readonly seasonId: number,
        public readonly isLastStep: boolean,
    ) {}
}
