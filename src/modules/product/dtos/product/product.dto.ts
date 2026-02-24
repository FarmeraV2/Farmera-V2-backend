import { Expose, Type } from 'class-transformer';
import { SubcategoryDto } from '../category/subcategory.dto';
import { ProductStatus } from '../../enums/product-status.enum';

// Use this DTO for listing products with essential details
export class ProductDto {
    @Expose() product_id: number;
    @Expose() product_name: string;
    @Expose() price_per_unit: number;
    @Expose() unit: string;
    @Expose() stock_quantity: number;
    @Expose() total_sold: number;
    @Expose() average_rating: number;
    @Expose() thumbnail?: string;
    @Expose() status: ProductStatus;
    @Expose() season_id?: number;
    @Expose() updated: Date;

    @Expose()
    @Type(() => SubcategoryDto)
    subcategories?: SubcategoryDto[];
}

const dtoProps = Object.keys(new ProductDto());
export const productSelectFields = dtoProps
    .map((prop) => {
        if (prop === 'subcategories') return null;
        return `product.${prop}`;
    })
    .filter((field): field is string => !!field);
