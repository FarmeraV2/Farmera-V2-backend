import { Expose } from "class-transformer";
import { SeasonStatus } from "../../enums/season-status.enum";

export class SeasonDto {
    @Expose() id: number;
    @Expose() name: string;
    @Expose() image_url?: string;
    @Expose() start_date: Date;
    @Expose() expected_end_date: Date;
    @Expose() actual_end_date?: Date;
    @Expose() status: SeasonStatus;
    @Expose() plot_id: number;
    @Expose() created: Date;
    @Expose() updated: Date;
}

export class SeasonDetailDto {
    @Expose() id: number;
    @Expose() name: string;
    @Expose() image_url?: string;
    @Expose() start_date: Date;
    @Expose() expected_end_date: Date;
    @Expose() actual_end_date?: Date;
    @Expose() status: SeasonStatus;
    @Expose() expected_yield: number;
    @Expose() actual_yield?: number;
    @Expose() yield_unit: string;
    @Expose() notes?: string;
    @Expose() plot_id: number;
    @Expose() created: Date;
    @Expose() updated: Date;
}

const seasonProps = Object.keys(new SeasonDto());
export const seasonSelectFields = seasonProps
    .map((prop) => {
        return `season.${prop}`;
    })

const seasonDetailProps = Object.keys(new SeasonDetailDto());
export const seasonDetailSelectFields = seasonDetailProps
    .map((prop) => {
        return `season.${prop}`;
    })