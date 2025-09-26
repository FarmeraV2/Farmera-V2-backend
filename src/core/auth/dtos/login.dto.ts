import { IsEmail, IsNotEmpty, IsPhoneNumber, ValidateIf } from 'class-validator';

export class LoginDto {
    @ValidateIf((o) => !o.phone) // if phone is undefined, email is required
    @IsEmail()
    email?: string;

    @ValidateIf((o) => !o.email) // if email is undefined, phone is required
    @IsPhoneNumber('VN')
    phone?: string;

    @IsNotEmpty()
    password: string;
}
