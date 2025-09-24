import { Expose, Type } from "class-transformer";
import { PaymentMethod } from "../../entities/payment-method.entity";
import { Gender } from "../../enums/gender.enum";
import { UserStatus } from "../../enums/user-status.enum";
import { AddressDto } from "src/modules/address/dtos/address.dto";
import { UserRole } from "src/common/enums/role.enum";

/**
 * A DTO returning basic information of `User` that is visible to client
 * 
 * DTO lấy thông tin người dùng thấy được, bỏ các trường không cần thiết
 */
export class UserDto {
    @Expose() id: number;
    @Expose() uuid: string;
    @Expose() email: string;
    @Expose() phone: string;
    @Expose() first_name: string;
    @Expose() last_name: string;
    @Expose() gender: Gender;
    @Expose() avatar?: string;
    @Expose() birthday?: Date;
    @Expose() role: UserRole;
    @Expose() points: number;
    @Expose() status: UserStatus;
    @Expose() payment_methods?: PaymentMethod[];
    @Expose() created_at: Date;
    @Expose() updated_at: Date;

    @Expose()
    @Type(() => AddressDto)
    addresses?: AddressDto[];
}

export class PublicUserDto {
    @Expose() email: string;
    @Expose() first_name: string;
    @Expose() last_name: string;
    @Expose() gender: Gender;
    @Expose() avatar?: string;
    @Expose() role: UserRole;
    @Expose() status: UserStatus;
}

export const publicUserFields: (keyof PublicUserDto)[] = [
    'email',
    'first_name',
    'last_name',
    'gender',
    'avatar',
    'role',
    'status',
];
