import { Expose, Type } from 'class-transformer';
import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { PaginationOptions } from 'src/common/dtos/pagination/pagination-option.dto';
import { OrderStatus } from '../enums/order-status.enum';
import { OrderSortField } from '../enums/order-sort-fields.enum';
import { ProductDto } from 'src/modules/product/dtos/product/product.dto';
import { FarmDto } from 'src/modules/farm/dtos/farm/farm.dto';
import { PaymentDto } from './payment.dto';
import { DeliveryDto } from './delivery.dto';
import { DeliveryAddressDto } from 'src/modules/address/dtos/delivery-address.dto';

export class GetMyOrdersDto extends PaginationOptions<OrderSortField> {
    @IsOptional()
    @IsEnum(OrderStatus)
    status?: OrderStatus;

    @IsOptional()
    @IsEnum(OrderSortField)
    sort_by: OrderSortField = OrderSortField.CREATED;

    @IsOptional()
    @IsDateString()
    start_date?: string;

    @IsOptional()
    @IsDateString()
    end_date?: string;
}


export class OrderDetailDto {
    @Expose()
    id: number;

    @Expose()
    ordered_quantity: number;

    @Expose()
    weight: number;

    @Expose()
    unit: string;

    @Expose()
    unit_price: number;

    @Expose()
    total_price: number;

    @Expose()
    status: string;

    @Expose()
    @Type(() => ProductDto)
    product: ProductDto;
}

export class OrderDto {
    @Expose()
    id: number;

    @Expose()
    store_id: number;

    @Expose()
    total_amount: number;

    @Expose()
    shipping_fee: number;

    @Expose()
    status: string;

    @Expose()
    created: Date;

    @Expose()
    updated: Date;

    @Expose()
    @Type(() => OrderDetailDto)
    order_details: OrderDetailDto[];

    @Expose()
    @Type(() => PaymentDto)
    payment: PaymentDto;

    @Expose()
    @Type(() => DeliveryDto)
    delivery: DeliveryDto;

    @Expose()
    @Type(() => FarmDto)
    farm: FarmDto;

    @Expose()
    delivery_note: string;

    @Expose()
    @Type(() => DeliveryAddressDto)
    delivery_address: DeliveryAddressDto;
}