import { IsOptional, IsString, IsBoolean, IsNotEmpty, IsPhoneNumber, IsEnum } from 'class-validator';
import { LocationType } from '../../enums/location-type.enums';

export class UpdateLocationDto {
    @IsString()
    name: string;

    @IsString()
    @IsPhoneNumber("VN")
    @IsNotEmpty()
    phone: string;

    @IsString()
    city: string;

    @IsString()
    district: string;

    @IsString()
    ward: string;

    @IsString()
    street: string;

    @IsString()
    address_line: string;

    @IsOptional()
    @IsEnum(LocationType)
    type?: LocationType;

    @IsOptional()
    @IsBoolean()
    is_primary?: boolean;
}