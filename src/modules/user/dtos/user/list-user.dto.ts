import { PaginationOptions } from "src/common/dtos/pagination/pagination-option.dto";
import { UserSortFields } from "../../enums/user-sort-fields.enum";
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class ListUserDto extends PaginationOptions<UserSortFields> {
    @IsOptional()
    @IsEnum(UserSortFields)
    sort_by: UserSortFields;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    search?: string;
}