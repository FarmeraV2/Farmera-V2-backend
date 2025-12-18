import { IsOptional, IsString, IsBoolean, IsNotEmpty, IsPhoneNumber, IsNumber, IsPositive } from 'class-validator';

export class UpdateAddressDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    @IsPhoneNumber('VN')
    @IsNotEmpty()
    phone?: string;

    @IsOptional()
    @IsNumber()
    @IsPositive()
    province_code?: number;

    @IsOptional()
    @IsNumber()
    @IsPositive()
    ward_code?: number;

    @IsOptional()
    @IsNumber()
    @IsPositive()
    old_province_code?: number;

    @IsOptional()
    @IsNumber()
    @IsPositive()
    old_district_code?: number;

    @IsOptional()
    @IsNumber()
    @IsPositive()
    old_ward_code?: number;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    street?: string;

    @IsString()
    @IsOptional()
    postal_code?: string;

    @IsOptional()
    @IsString()
    type?: string;

    @IsOptional()
    @IsBoolean()
    is_primary?: boolean;
}
