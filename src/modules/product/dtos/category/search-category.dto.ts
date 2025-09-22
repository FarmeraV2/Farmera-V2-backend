import { IsNotEmpty, IsString } from "class-validator";
import { PaginationOptions } from "src/common/dtos/pagination/pagination-option.dto";

export class SearchCategoryDto extends PaginationOptions {
    @IsString()
    @IsNotEmpty()
    query: string;
}