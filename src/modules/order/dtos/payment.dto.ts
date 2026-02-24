import { Expose } from 'class-transformer';
import { PaymentMethod, PaymentStatus } from '../enums/payment.enum';

export class PaymentDto {
    @Expose()
    id: number;

    @Expose()
    status: PaymentStatus;

    @Expose()
    method: PaymentMethod;

    @Expose()
    total_amount: number;

    @Expose()
    qr_code: string | null;

    @Expose()
    checkout_url: string | null;

    @Expose()
    transaction_id: string;

    @Expose()
    amount: number;

    @Expose()
    created: Date;

    @Expose()
    updated: Date;

    @Expose()
    payment_time: Date;

    @Expose()
    currency: string;
}
