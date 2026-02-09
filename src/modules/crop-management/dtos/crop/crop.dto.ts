import { Expose } from "class-transformer";
import { CropType } from "../../enums/crop-type.enum";

export class CropDto {
    @Expose() id: string;
    @Expose() name: string;
    @Expose() crop_type: CropType;
    @Expose() image_url: string;
    @Expose() description?: string;
    @Expose() max_seasons: number;
}

const cropDtoProps = Object.keys(new CropDto());
export const cropSelectFields = cropDtoProps
    .map((prop) => {
        return `crop.${prop}`;
    })

export class CropDetailDto {
    @Expose() id: string;
    @Expose() name: string;
    @Expose() crop_type: CropType;
    @Expose() description: string;
    @Expose() image_urls: string[];
    @Expose() max_seasons: number;
    @Expose() created: Date;
    @Expose() updated: Date;
}

const cropDetailDtoProps = Object.keys(new CropDetailDto());
export const cropDetailSelectFields = cropDetailDtoProps
    .map((prop) => {
        return `crop.${prop}`;
    })