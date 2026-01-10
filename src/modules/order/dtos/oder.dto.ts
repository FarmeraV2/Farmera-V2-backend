import { Expose, Type } from 'class-transformer';
import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { PaginationOptions } from 'src/common/dtos/pagination/pagination-option.dto';
import { OrderStatus } from '../enums/order-status.enum';
import { OrderSortField } from '../enums/order-sort-fields.enum';
import { ProductDto } from 'src/modules/product/dtos/product/product.dto';

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
    payment: any; // Có thể tạo PaymentDto nếu cần

    @Expose()
    delivery: any; // Có thể tạo DeliveryDto nếu cần

    @Expose()
    farm: any; // Có thể tạo FarmDto nếu cần
}