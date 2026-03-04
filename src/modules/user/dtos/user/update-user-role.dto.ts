import { Type } from "class-transformer";
import { IsEnum, IsNumber } from "class-validator";
import { UserRole } from "src/common/enums/role.enum";

export class UpdateUserRoleDto {
    @IsNumber()
    @Type(() => Number)
    user_id: number;

    @IsEnum(UserRole)
    role: UserRole;
}