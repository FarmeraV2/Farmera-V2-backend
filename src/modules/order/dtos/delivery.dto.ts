import { Expose } from 'class-transformer';
import { DeliveryPaymentType, DeliveryRequiredNote, DeliveryStatus } from '../enums/delivery-status.enum';

export class DeliveryDto {
    @Expose()
    id: number;

    @Expose()
    order_id: number;

    @Expose()
    status: DeliveryStatus;

    @Expose()
    real_shipping_fee: number;

    @Expose()
    cod_amount: number;

    @Expose()
    total_fee: number;

    @Expose()
    tracking_number: string;

    @Expose()
    ghn_order_code: string;

    @Expose()
    content: string;

    @Expose()
    note: string;

    @Expose()
    required_note: DeliveryRequiredNote;

    @Expose()
    delivery_instructions: string;

    @Expose()
    delivery_method: string;

    @Expose()
    payment_type_id: DeliveryPaymentType;

    @Expose()
    ship_date: Date;

    @Expose()
    created: Date;

    @Expose()
    updated: Date;
}
