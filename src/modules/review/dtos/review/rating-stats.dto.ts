export class RatingBreakdown {
    count: number;
    percentage: number;

    constructor(count: number, total: number) {
        this.count = count;
        this.percentage = total === 0 ? 0 : parseFloat(((count / total) * 100).toFixed(2));
    }
}

export class RatingStatsDto {
    totalCount: number;
    totalRating: number;
    averageRating: number;
    ratings: Record<number, RatingBreakdown>;

    constructor(counts: Record<number, number>) {
        this.totalCount = Object.values(counts).reduce((sum, val) => sum + val, 0);
        this.totalRating = Object.entries(counts).reduce((sum, [rating, count]) => sum + Number(rating) * count, 0);
        this.averageRating = this.totalCount === 0 ? 0 : parseFloat((this.totalRating / this.totalCount).toFixed(2));

        this.ratings = {} as Record<number, RatingBreakdown>;
        for (let i = 1; i <= 5; i++) {
            const count = counts[i] || 0;
            this.ratings[i] = new RatingBreakdown(count, this.totalCount);
        }
    }
}
