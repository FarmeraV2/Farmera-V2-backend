import { PaginationOptions } from "src/common/dtos/pagination/pagination-option.dto";
import { StepSortFields } from "../../enums/step-sort-fields.enum";
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { CropType } from "../../enums/crop-type.enum";
import { StepType } from "../../enums/step-type.enum";

export class ListStepDto extends PaginationOptions<StepSortFields> {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    search?: string;

    @IsOptional()
    @IsEnum(StepSortFields)
    sort_by: StepSortFields = StepSortFields.ID;

    @IsOptional()
    @IsEnum(CropType)
    for_crop_type?: CropType;

    @IsOptional()
    @IsEnum(StepType)
    type?: StepType
}