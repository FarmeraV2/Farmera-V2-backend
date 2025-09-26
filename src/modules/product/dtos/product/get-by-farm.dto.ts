import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { PaginationOptions } from 'src/common/dtos/pagination/pagination-option.dto';
import { ProductSortField } from '../../enums/product-sort-fields.enum';

export class GetProductByFarmDto extends PaginationOptions<ProductSortField> {
    @IsOptional()
    @IsEnum(ProductSortField)
    sort_by: ProductSortField = ProductSortField.CREATED;

    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    include_categories?: boolean;
}
