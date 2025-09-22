import { IsBoolean, IsEnum, IsNotEmpty, IsPhoneNumber, IsString } from "class-validator";
import { LocationType } from "../../enums/location-type.enums";

export class CreateLocationDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    @IsPhoneNumber("VN")
    phone: string;

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
    @IsNotEmpty()
    address_line: string;

    @IsEnum(LocationType)
    @IsNotEmpty()
    type: LocationType

    @IsBoolean()
    @IsNotEmpty()
    is_primary: boolean;
}