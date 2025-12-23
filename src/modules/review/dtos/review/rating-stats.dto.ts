export class RatingBreakdown {
    star: number;
    count: number;
    percentage: number;

    constructor(star: number, count: number, total: number) {
        this.star = star;
        this.count = count;
        this.percentage = total === 0 ? 0 : parseFloat(((count / total) * 100).toFixed(2));
    }
}

export class RatingStatsDto {
    total_count: number;
    total_rating: number;
    average_rating: number;
    ratings: RatingBreakdown[];

    constructor(counts: Record<number, number>) {
        this.total_count = Object.values(counts).reduce((sum, val) => sum + val, 0);
        this.total_rating = Object.entries(counts).reduce((sum, [rating, count]) => sum + Number(rating) * count, 0);
        this.average_rating = this.total_count === 0 ? 0 : parseFloat((this.total_rating / this.total_count).toFixed(2));

        this.ratings = [];
        for (let i = 1; i <= 5; i++) {
            const count = counts[i] || 0;
            this.ratings.push(new RatingBreakdown(i, count, this.total_count));
        }
    }
}
