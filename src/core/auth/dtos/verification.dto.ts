import { IsEmail, IsNotEmpty, IsPhoneNumber, IsString, Length } from 'class-validator';

export class SendVerificationEmailDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;
}

export class SendVerificationPhoneDto {
    @IsPhoneNumber('VN')
    @IsNotEmpty()
    phone: string;
}

export class VerifyEmailDto {
    @IsString()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    @Length(4, 6)
    verification_code: string;
}

export class VerifyPhoneDto {
    @IsPhoneNumber('VN')
    @IsNotEmpty()
    phone: string;

    @IsString()
    @IsNotEmpty()
    @Length(4, 6)
    verification_code: string;
}
