import { IsBoolean, IsLatitude, IsLongitude, IsNotEmpty, IsNumber, IsOptional, IsPhoneNumber, IsPositive, IsString } from 'class-validator';

export class CreateAddressDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    @IsPhoneNumber('VN')
    phone: string;

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
    @IsNotEmpty()
    address_line: string;

    @IsString()
    @IsOptional()
    postal_code?: string;

    @IsString()
    @IsOptional()
    type?: string;

    @IsBoolean()
    @IsOptional()
    is_primary?: boolean;
}

export class CreateFarmAddressDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    @IsPhoneNumber('VN')
    phone: string;

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
