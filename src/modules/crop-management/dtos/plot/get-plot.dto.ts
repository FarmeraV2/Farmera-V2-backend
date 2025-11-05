import { PaginationOptions } from "src/common/dtos/pagination/pagination-option.dto";
import { PlotSortFields } from "../../enums/plot-sort-fields.enum";
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { CropType } from "../../enums/crop-type.enum";

export class GetPlotDto extends PaginationOptions<PlotSortFields> {
    @IsOptional()
    @IsEnum(PlotSortFields)
    sort_by: PlotSortFields = PlotSortFields.ID;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    search?: string;

    @IsOptional()
    @IsEnum(CropType)
    crop_type?: CropType;
}