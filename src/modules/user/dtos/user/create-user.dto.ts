import { IsDate, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsPhoneNumber, IsString, Matches, MaxLength, MinLength, ValidateNested } from "class-validator";
import { Gender } from "../../enums/gender.enum";
import { Type } from "class-transformer";

/**
 * DTO for registering a new user. Contains the necessary information required for creating a user account
 * 
 * DTO đăng kí user mới với các trườg cần thiết
 */
export class CreateUserDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsPhoneNumber("VN")
    @IsNotEmpty()
    phone: string;

    @IsString()
    @IsNotEmpty()
    first_name: string;

    @IsString()
    @IsNotEmpty()
    last_name: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
        message:
            'password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number and 1 special character',
    })
    password: string;

    @IsEnum(Gender)
    @IsOptional()
    gender?: Gender;

    @IsDate()
    @IsOptional()
    @Type(() => Date)
    birthday?: Date;
}