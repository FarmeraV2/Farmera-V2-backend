import { Expose, Type } from "class-transformer";
import { LocationDto } from "src/common/dtos/location/location.dto";

export class PlotDto {
    @Expose() id: number;
    @Expose() plot_name: string;
    @Expose() crop_name: string;
    @Expose() image_url: string;
    @Expose() created: Date;
    @Expose() updated: Date;
}

const plotDtoProps = Object.keys(new PlotDto());
export const plotSelectFields = plotDtoProps
    .map((prop) => {
        return `plot.${prop}`;
    })

export class PlotDetailDto {
    @Expose() id: number;
    @Expose() plot_name: string;
    @Expose() crop_name: string;
    @Expose() area: number;
    @Expose()
    @Type(() => LocationDto)
    location: LocationDto
    @Expose() notes: string;
    @Expose() image_url: string;
    @Expose() created: Date
    @Expose() updated: Date
    @Expose() transparency_score?: number;
    @Expose() crop_id: number;
}

const plotDetailDtoProps = Object.keys(new PlotDetailDto());
export const plotDetailSelectFields = plotDetailDtoProps
    .map((prop) => {
        return `plot.${prop}`;
    })