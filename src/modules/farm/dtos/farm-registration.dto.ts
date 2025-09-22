import { IsEmail, IsNotEmpty, IsOptional, IsPhoneNumber, IsString, } from 'class-validator';

export class FarmRegistrationDto {
    @IsString()
    @IsNotEmpty()
    farm_name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsString()
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsNotEmpty()
    @IsPhoneNumber('VN')
    phone: string;

    @IsString()
    @IsOptional()
    tax_number?: string;

    @IsString()
    @IsNotEmpty()
    city: string;

    @IsString()
    @IsNotEmpty()
    district: string;

    @IsString()
    @IsNotEmpty()
    ward: string;

    @IsString()
    @IsNotEmpty()
    street: string;

    @IsString()
    @IsOptional()
    coordinate?: string;
}