import { PaginationOptions } from "src/common/dtos/pagination/pagination-option.dto";

export class GetChannelDto extends PaginationOptions {
    sort_by: string;
}