import { PaginationOptions } from "src/common/dtos/pagination/pagination-option.dto";
import { TemplateSortField } from "../../enums/template-sort-fields.enum";
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class GetTemplateDto extends PaginationOptions<TemplateSortField> {
    @IsOptional()
    @IsEnum(TemplateSortField)
    sort_by: TemplateSortField = TemplateSortField.TEMPLATE_ID;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    search?: string;
}