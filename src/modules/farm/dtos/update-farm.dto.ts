import { IsEmail, IsNumberString, IsOptional, IsPositive, IsString } from "class-validator";

export class UpdateFarmDto {
    @IsOptional()
    @IsString()
    farm_name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsNumberString()
    phone?: string;

    @IsOptional()
    @IsString()
    tax_number?: string;
}