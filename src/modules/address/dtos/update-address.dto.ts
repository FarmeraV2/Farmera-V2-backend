import { IsOptional, IsString, IsBoolean, IsNotEmpty, IsPhoneNumber, IsEnum, IsNumber, IsPositive } from 'class-validator';
import { AddressType } from '../enums/address-type.enums';

export class UpdateAddressDto {
    @IsString()
    name: string;

    @IsString()
    @IsPhoneNumber("VN")
    @IsNotEmpty()
    phone: string;

    @IsNumber()
    @IsPositive()
    province_code: number;

    @IsNumber()
    @IsPositive()
    ward_code: number;

    @IsString()
    street: string;

    @IsString()
    address_line: string;

    @IsString()
    @IsOptional()
    type?: string;

    @IsOptional()
    @IsBoolean()
    is_primary?: boolean;
}