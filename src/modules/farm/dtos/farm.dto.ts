import { Expose } from "class-transformer";

export class FarmSummaryDto {
    @Expose() id: number;
    @Expose() farm_name: string;
    @Expose() description: string;
    @Expose() avatar_url: string;
}

const dtoProps = Object.keys(new FarmSummaryDto());
export const FarmSummaryDtoSelectFields = dtoProps
    .map((prop) => `farm.${prop}`);