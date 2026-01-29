import { PaginationOptions } from "src/common/dtos/pagination/pagination-option.dto";
import { StepSortFields } from "../../enums/step-sort-fields.enum";
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
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
    @IsEnum(StepType)
    type?: StepType
}