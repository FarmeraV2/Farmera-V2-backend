import { PaginationOptions } from "src/common/dtos/pagination/pagination-option.dto";
import { CropSortFields } from "../../enums/crop-sort-fields.enum";
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { ParseEnumArray } from "src/common/decorators/parse-enum-array";
import { CropType } from "../../enums/crop-type.enum";


export class GetCropDto extends PaginationOptions<CropSortFields> {
    @IsOptional()
    @IsEnum(CropSortFields)
    sort_by: CropSortFields = CropSortFields.NAME;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    search?: string;

    @IsOptional()
    @ParseEnumArray(CropType)
    crop_type?: CropType[];
}