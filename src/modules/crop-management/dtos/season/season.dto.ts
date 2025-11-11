import { Expose } from "class-transformer";
import { SeasonStatus } from "../../enums/season-status.enum";

export class SeasonDto {
    @Expose() id: number;
    @Expose() name: string;
    @Expose() start_date: Date;
    @Expose() expected_end_date: Date;
    @Expose() actual_end_date?: Date;
    @Expose() status: SeasonStatus;
    @Expose() created: Date;
    @Expose() updated: Date;
}

const seasonProps = Object.keys(new SeasonDto());
export const seasonSelectFields = seasonProps
    .map((prop) => {
        return `season.${prop}`;
    })