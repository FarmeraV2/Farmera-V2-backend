import { Expose } from "class-transformer";
import { ProductStatus } from "../../enums/product-status.enum";

export class FarmProductDto {
    @Expose() product_id: number;
    @Expose() product_name: string;
    @Expose() price_per_unit: number;
    @Expose() unit: string;
    @Expose() stock_quantity: number;
    @Expose() low_stock_threshold: number;
    @Expose() total_sold: number;
    @Expose() average_rating: number;
    @Expose() thumbnail?: string;
    @Expose() status: ProductStatus;
    @Expose() season_id?: number;
    @Expose() updated: Date;
}

const farmDtoProps = Object.keys(new FarmProductDto());
export const farmProductSelectFields = farmDtoProps
    .map((prop) => `product.${prop}`);