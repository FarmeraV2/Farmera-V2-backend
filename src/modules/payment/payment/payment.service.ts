import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../../order/entities/payment.entity';
import { PaymentMethod, PaymentStatus } from '../../order/enums/payment.enum';
import { PayosService } from './payos.service';
import { ResponseOrderPayOSDto } from './dtos/response-order-payos.dto';

@Injectable()
export class PaymentService {
    private readonly logger = new Logger(PaymentService.name);

    constructor(
        @InjectRepository(Payment)
        private readonly paymentRepository: Repository<Payment>,
        private readonly payosService: PayosService,
    ) {}

    async createPayOSPayment(paymentId: number, amount: number, description: string): Promise<ResponseOrderPayOSDto> {
        try {
            const payment = await this.paymentRepository.findOne({
                where: { id: paymentId }
            });

            if (!payment) {
                throw new Error('Payment not found');
            }

            // Tạo order code unique (sử dụng timestamp + paymentId)
            const orderCode = parseInt(`${Date.now()}${paymentId}`.slice(-10)); // Lấy 10 chữ số cuối

            // Gọi PayOS service để tạo đơn hàng
            const payosResult = await this.payosService.createPayOSOrder(
                amount,
                description,
                orderCode
            );

            // Cập nhật payment với thông tin PayOS
            await this.paymentRepository.update(paymentId, {
                method: PaymentMethod.PAYOS,
                status: PaymentStatus.PENDING,
                checkout_url: payosResult.data.checkoutUrl,
                qr_code: payosResult.data.qrCode,
                transaction_id: orderCode.toString()
            });

            return payosResult;

        } catch (error) {
            this.logger.error(`Failed to create PayOS payment: ${error.message}`);
            throw error;
        }
    }

}