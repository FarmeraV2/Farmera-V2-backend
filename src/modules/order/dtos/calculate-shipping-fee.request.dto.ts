import { Type } from "class-transformer";
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, ValidateNested } from "class-validator";

enum ShippingCarrier {
    GHN = 'GHN',
    GHTK = 'GHTK',
    VIETTEL_POST = 'VIETTEL_POST',
    VN_POST = 'VN_POST'
}

class ProductItem {
    @Type(() => Number)
    @IsNotEmpty()
    @IsNumber()
    product_id: number;

    @Type(() => Number)
    @IsNotEmpty()
    @IsNumber()
    quantity: number;
}

export class CalculateShippingFeeRequestDto {
    @Type(() => Number)
    @IsOptional()
    @IsNumber()
    delivery_address_id?: number;

    @Type(() => Number)
    @IsNotEmpty()
    @IsNumber()
    farm_id: number;

    @IsOptional()
    @IsEnum(ShippingCarrier)
    shipping_carrier?: ShippingCarrier;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ProductItem)
    @IsNotEmpty()
    products: ProductItem[];
}