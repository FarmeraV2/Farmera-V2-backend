import { Type } from "class-transformer";
import { IsBoolean, IsOptional } from "class-validator";

export class GetUserDetailDto {
    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    include_locations: boolean;

    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    include_payment_methods: boolean;
}

// export class ListUserDto extends PaginationOptions {
//     @IsOptional()
//     @IsEnum(UserRole)
//     role_filter?: UserRole;

//     @IsOptional()
//     @IsEnum(UserStatus)
//     status_filter?: UserStatus;

//     @IsOptional()
//     @IsString()
//     search_query?: string;

//     @IsOptional()
//     @IsDate()
//     @Type(() => Date)
//     start_time?: Date;

//     @IsOptional()
//     @IsDate()
//     @Type(() => Date)
//     end_time?: Date;
// }