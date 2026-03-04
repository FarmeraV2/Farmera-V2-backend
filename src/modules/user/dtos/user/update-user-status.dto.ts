import { Type } from "class-transformer";
import { IsEnum, IsNumber } from "class-validator";
import { UserStatus } from "src/modules/user/enums/user-status.enum";

export class UpdateUserStatus {
    @IsNumber()
    @Type(() => Number)
    user_id: number;

    @IsEnum(UserStatus)
    status: UserStatus;
}