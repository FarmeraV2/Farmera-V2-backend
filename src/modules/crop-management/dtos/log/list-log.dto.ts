import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";
import { PaginationOptions } from "src/common/dtos/pagination/pagination-option.dto";

export class ListLogDto extends PaginationOptions {
    sort_by: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    farm_search?: string;

    @IsOptional()
    @IsNumber()
    @IsPositive()
    farm_id?: number;
}