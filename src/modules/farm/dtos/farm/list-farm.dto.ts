import { Type } from "class-transformer";
import { IsEnum, IsLatitude, IsLongitude, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";
import { PaginationOptions } from "src/common/dtos/pagination/pagination-option.dto";
import { FarmSortField } from "../../enums/farm-sort-fileds.enum";
import { FarmStatus } from "../../enums/farm-status.enum";
import { ParseEnumArray } from "src/common/decorators/parse-enum-array";

export class ListFarmDto extends PaginationOptions<FarmSortField> {
    @IsOptional()
    @IsEnum(FarmSortField)
    sort_by: FarmSortField = FarmSortField.CREATED;

    @IsOptional()
    @IsString()
    query?: string;

    @IsOptional()
    @ParseEnumArray(FarmStatus)
    status: FarmStatus[];

    @IsOptional()
    @IsLatitude()
    @Type(() => Number)
    latitude?: number;

    @IsOptional()
    @IsLongitude()
    @Type(() => Number)
    longitude?: number;

    @IsOptional()
    @IsNumber()
    @IsPositive()
    @Type(() => Number)
    radius_km?: number;
}
