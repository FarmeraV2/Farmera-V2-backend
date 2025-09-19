import { Expose } from "class-transformer";
import { Location } from "../../entities/location.entity";
import { PaymentMethod } from "../../entities/payment-method.entity";
import { Gender } from "../../enums/gender.enum";
import { UserRole } from "../../enums/role.enum";
import { UserStatus } from "../../enums/user-status.enum";

/**
 * A DTO returning basic information of `User` that is visible to client
 * 
 * DTO lấy thông tin người dùng thấy được, bỏ các trường không cần thiết
 */
export class UserDto {
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
    @Expose() locations?: Location[];
    @Expose() payment_methods?: PaymentMethod[];
    @Expose() created_at: Date;
    @Expose() updated_at: Date;
}