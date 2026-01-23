import { Expose, Type } from "class-transformer";
import { ProductStatus } from "../../enums/product-status.enum";
import { FarmSummaryDto } from "src/modules/farm/dtos/farm/farm.dto";
import { SubcategoryDto } from "../category/subcategory.dto";

export class ProductDetailDto {
    @Expose() product_id: number;
    @Expose() product_name: string;
    @Expose() description: string;
    @Expose() price_per_unit: number;
    @Expose() unit: string;
    @Expose() weight_per_unit: number;
    @Expose() stock_quantity: number;
    @Expose() total_sold: number;
    @Expose() average_rating: number;
    @Expose() thumbnail: string;
    @Expose() image_urls: string[] | null;
    @Expose() video_urls: string[] | null;
    @Expose() status: ProductStatus;
    @Expose() created: Date;
    @Expose() updated: Date;
    @Expose() season_id?: number;

    @Expose()
    @Type(() => FarmSummaryDto)
    farm: FarmSummaryDto;

    @Expose()
    @Type(() => SubcategoryDto)
    subcategories?: SubcategoryDto[];
}

const dtoProps = Object.keys(new ProductDetailDto());
export const productDetailSelectFields = dtoProps
    .map((prop) => {
        if (prop === 'subcategories' || prop === 'farm') return null;
        return `product.${prop}`;
    })
    .filter((field): field is string => !!field);