import { PaginationOptions } from "src/common/dtos/pagination/pagination-option.dto";

export class GetStepDto extends PaginationOptions {
    sort_by: string;
}