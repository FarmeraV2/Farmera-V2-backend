import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPhoneNumber, IsPositive, IsString } from "class-validator";
import { AddressType } from "../enums/address-type.enums";

export class CreateAddressDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    @IsPhoneNumber("VN")
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