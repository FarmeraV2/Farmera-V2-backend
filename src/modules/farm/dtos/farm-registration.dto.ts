import { IsEmail, IsLatitude, IsLongitude, IsNotEmpty, IsNumber, IsOptional, IsPhoneNumber, IsPositive, IsString } from 'class-validator';

export class FarmRegistrationDto {
    @IsString()
    @IsNotEmpty()
    farm_name: string;

    @IsString()
    @IsOptional()
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

    @IsNumber()
    @IsPositive()
    province_code: number;

    @IsNumber()
    @IsPositive()
    ward_code: number;

    @IsString()
    @IsNotEmpty()
    street: string;

    @IsString()
    @IsOptional()
    postal_code?: string;

    @IsNumber()
    @IsLatitude()
    latitude: number;

    @IsNumber()
    @IsLongitude()
    longitude: number;
}
