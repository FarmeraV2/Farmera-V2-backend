export interface SeasonStepScore {
    transparencyScore: number;   // [0, 1] — SeasonDetail.transparency_score
    startedAt: Date;             // SeasonDetail.created — step initiation timestamp
    minDayDuration: number | null;
    maxDayDuration: number | null;
}

export interface SeasonScoreData {
    seasonId: number;
    steps: SeasonStepScore[];    // ordered by Step.order ASC, only scored steps
}