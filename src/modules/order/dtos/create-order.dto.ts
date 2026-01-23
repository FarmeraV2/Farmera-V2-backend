import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsNumber, IsOptional, IsPositive, IsString, ValidateNested } from 'class-validator';
import { PaymentMethod } from '../enums/payment.enum';

export class CreateOrderItemDto {
    @Type(() => Number)
    @IsInt()
    @IsPositive()
    product_id: number;

    @Type(() => Number)
    @IsInt()
    @IsPositive()
    quantity: number;

    @IsOptional()
    @IsString()
    note?: string;
}

export class CreateSingleOrderDto {
    @Type(() => Number)
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

    @Type(() => Number)
    @IsNumber()
    @IsPositive()
    shipping_fee: number;



}

export class CreateBatchOrderDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateSingleOrderDto)
    orders: CreateSingleOrderDto[];

    @IsEnum(PaymentMethod)
    payment_method: PaymentMethod;

    @Type(() => Number)
    @IsOptional()
    @IsInt()
    @IsPositive()
    delivery_address_id: number;
}