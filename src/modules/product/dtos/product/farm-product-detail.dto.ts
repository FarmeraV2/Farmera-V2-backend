import { Expose } from "class-transformer";
import { ProductStatus } from "../../enums/product-status.enum";

export class FarmProductDetailDto {
    @Expose() product_id: number;
    @Expose() product_name: string;
    @Expose() description: string;
    @Expose() price_per_unit: number;
    @Expose() unit: string;
    @Expose() weight_per_unit: number;
    @Expose() stock_quantity: number;
    @Expose() low_stock_threshold: number;
    @Expose() total_sold: number;
    @Expose() average_rating: number;
    @Expose() thumbnail: string;
    @Expose() image_urls: string[] | null;
    @Expose() video_urls: string[] | null;
    @Expose() status: ProductStatus;
    @Expose() created: Date;
    @Expose() updated: Date;
    @Expose() qr_code?: string;
    @Expose() season_id?: number;
}

const farmProductDetailDtoProps = Object.keys(new FarmProductDetailDto());
export const farmProductDetailSelectFields = farmProductDetailDtoProps
    .map((prop) => {
        if (prop === 'subcategories' || prop === 'farm') return null;
        return `product.${prop}`;
    })
    .filter((field): field is string => !!field);