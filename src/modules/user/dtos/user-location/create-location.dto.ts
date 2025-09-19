import { IsBoolean, IsNotEmpty, IsPhoneNumber, IsString } from "class-validator";

export class CreateLocationDto {
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

    @IsString()
    @IsNotEmpty()
    type: string; // e.g., 'home', 'work', 'shipping', etc.

    @IsBoolean()
    @IsNotEmpty()
    is_primary: boolean;

    @IsString()
    @IsNotEmpty()
    user_id: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsPhoneNumber("VN")
    @IsNotEmpty()
    phone: string
}