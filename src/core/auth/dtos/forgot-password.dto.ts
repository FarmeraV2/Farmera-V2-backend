import { IsEmail, IsNotEmpty, IsPhoneNumber, ValidateIf } from 'class-validator';

export class ForgotPasswordDto {
    @ValidateIf(o => !o.phone) // if phone is undefined, email is required
    @IsEmail()
    email?: string;

    @ValidateIf(o => !o.email) // if email is undefined, phone is required
    @IsPhoneNumber('VN')
    phone?: string;
}

export class UpdateNewPasswordDto {
    @ValidateIf(o => !o.phone)
    @IsEmail()
    email?: string;

    @ValidateIf(o => !o.email)
    @IsPhoneNumber('VN')
    phone?: string;

    @IsNotEmpty()
    code: string;

    @IsNotEmpty()
    newPassword: string;
}