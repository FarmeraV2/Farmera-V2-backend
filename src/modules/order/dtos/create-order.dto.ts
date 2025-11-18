import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, ValidateNested } from 'class-validator';
import { PaymentMethod } from '../enums/payment.enum';

export class CreateOrderItemDto {
    @IsInt()
    @IsPositive()
    product_id: number;

    @IsInt()
    @IsPositive()
    quantity: number;

    @IsOptional()
    @IsString()
    note?: string;
}

export class CreateSingleOrderDto {
    @IsInt()
    @IsPositive()
    farm_id: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateOrderItemDto)
    items: CreateOrderItemDto[];

    @IsOptional()
    @IsString()
    delivery_note?: string;

    @IsNumber()
    @IsPositive()
    shipping_fee: number;
    
    
    @IsOptional()
    @IsInt()
    @IsPositive()
    delivery_address_id: number;
}

export class CreateBathOrderDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateSingleOrderDto)
    orders: CreateSingleOrderDto[];
    
    @IsEnum(PaymentMethod)
    payment_method: PaymentMethod;
}