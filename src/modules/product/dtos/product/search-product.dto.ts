import { IsOptional, IsString, IsNumber, IsEnum, IsBoolean, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationOptions } from 'src/common/dtos/pagination/pagination-option.dto';
import { ProductStatus } from '../../enums/product-status.enum';
import { ProductSortField } from '../../enums/product-sort-fields.enum';
import { ParseNumberArray } from 'src/common/decorators/parse-number-array';
import { ParseEnumArray } from 'src/common/decorators/parse-enum-array';

export class SearchProductsDto extends PaginationOptions<ProductSortField> {
    @IsOptional()
    @IsEnum(ProductSortField)
    sort_by: ProductSortField = ProductSortField.CREATED;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    search?: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    min_price?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    max_price?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    min_rating?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    max_rating?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    min_total_sold?: number;

    @IsOptional()
    @ParseEnumArray(ProductStatus)
    status?: ProductStatus[];

    @IsOptional()
    @ParseNumberArray()
    subcategory_ids?: number[];

    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    is_category?: boolean;

    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    include_categories?: boolean;
}
