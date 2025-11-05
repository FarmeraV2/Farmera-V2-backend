import { Expose } from "class-transformer";

export class PlotDto {
    @Expose() id: number;
    @Expose() plot_name: string;
    @Expose() crop_name: string;
    @Expose() created: Date;
    @Expose() updated: Date;
}

const dtoProps = Object.keys(new PlotDto());
export const plotSelectFields = dtoProps
    .map((prop) => {
        return `plot.${prop}`;
    })
