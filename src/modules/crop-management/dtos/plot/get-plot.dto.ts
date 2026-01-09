import { PaginationOptions } from "src/common/dtos/pagination/pagination-option.dto";
import { PlotSortFields } from "../../enums/plot-sort-fields.enum";
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { CropType } from "../../enums/crop-type.enum";
import { Type } from "class-transformer";
import { ParseEnumArray } from "src/common/decorators/parse-enum-array";

export class GetPlotDto extends PaginationOptions<PlotSortFields> {
    @IsOptional()
    @IsEnum(PlotSortFields)
    sort_by: PlotSortFields = PlotSortFields.UPDATED;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    search?: string;

    @IsOptional()
    @ParseEnumArray(CropType)
    crop_type?: CropType[];

    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    is_deleted?: boolean = false;
}