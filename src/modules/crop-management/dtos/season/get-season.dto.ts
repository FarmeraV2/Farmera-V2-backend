import { IsBooleanString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";
import { PaginationOptions } from "src/common/dtos/pagination/pagination-option.dto";
import { SeasonStatus } from "../../enums/season-status.enum";
import { ParseEnumArray } from "src/common/decorators/parse-enum-array";
import { SeasonSortFields } from "../../enums/season-sort-fields.enum";
import { Order } from "src/common/enums/pagination.enum";
import { Type } from "class-transformer";

export class GetSeasonDto extends PaginationOptions {
    @IsOptional()
    @IsEnum(SeasonSortFields)
    sort_by: SeasonSortFields = SeasonSortFields.UPDATED;

    @IsOptional()
    @IsEnum(Order)
    order: Order = Order.DESC;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    search?: string;

    @IsOptional()
    @ParseEnumArray(SeasonStatus)
    season_status?: SeasonStatus[];

    @IsOptional()
    @IsBooleanString()
    is_assigned?: boolean;

    @IsOptional()
    @IsNumber()
    @IsPositive()
    @Type(() => Number)
    plot_id?: number;
}