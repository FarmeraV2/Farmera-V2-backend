import { Type } from "class-transformer";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { ItemDeliveryDto } from "./item-delivery.dto";

export class CalculateShippingFeeDto {
    @Type(() => Number)
    @IsNotEmpty()
    from_district_id: number;

    @IsString()
    @IsNotEmpty()
    from_ward_code: string;

    @Type(() => Number)
    @IsNotEmpty()
    to_district_id: number;

    @IsString()
    @IsOptional()
    to_ward_code: string;

    @Type(() => Number)
    @IsOptional()
    length?: number;

    @Type(() => Number)
    @IsOptional()
    width?: number;

    @Type(() => Number)
    @IsOptional()
    height?: number;

    @Type(() => Number)
    @IsNotEmpty()
    weight: number;

    @Type(() => Number)
    @IsOptional()
    insurance_value?: number;

    @IsString()
    @IsOptional()
    coupon?: string;

    @IsOptional()
    @Type(() => Number)
    cod_amount?: number;

    @IsString()
    @IsOptional()
    content?: string;
    @IsNotEmpty()
    items: ItemDeliveryDto[];

}