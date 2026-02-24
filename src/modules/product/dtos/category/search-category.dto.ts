import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { PaginationOptions } from "src/common/dtos/pagination/pagination-option.dto";
import { CategorySortFields } from "../../enums/category-sort-fields.enum";

export class GetCategoryDto extends PaginationOptions<CategorySortFields> {
    @IsOptional()
    @IsEnum(CategorySortFields)
    sort_by: CategorySortFields;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    search?: string;
}
