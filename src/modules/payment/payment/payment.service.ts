import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Payment } from '../../order/entities/payment.entity';
import { Order } from '../../order/entities/order.entity';
import { PaymentMethod, PaymentStatus } from '../../order/enums/payment.enum';
import { OrderStatus } from '../../order/enums/order-status.enum';
import { PayosService } from './payos.service';
import { ResponseOrderPayOSDto } from './dtos/response-order-payos.dto';
import { PayosWebhookDto } from './dtos/payos-webhook.dto';

@Injectable()
export class PaymentService {
    private readonly logger = new Logger(PaymentService.name);

    constructor(
        @InjectRepository(Payment)
        private readonly paymentRepository: Repository<Payment>,
        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,
        private readonly payosService: PayosService,
        private readonly dataSource: DataSource,
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
            const orderCode = parseInt(`${Date.now()}${paymentId}`.slice(-10));

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
    
    async handlePayOSCallback(data: PayosWebhookDto): Promise<boolean> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            if (!this.validatePayOSCallbackData(data)) {
                await queryRunner.rollbackTransaction();
                return false;
            }

            // Xác thực chữ ký
            const verifySignature = this.payosService.verifySignature(data);
            if (!verifySignature) {
                this.logger.error(`PayOS signature verification failed for orderCode: ${data.data.orderCode}`);
                await queryRunner.rollbackTransaction();
                return false;
            }

            // Tìm payment theo transaction_id (orderCode từ PayOS)
            const payment = await queryRunner.manager.findOne(Payment, {
                where: {
                    transaction_id: data.data.orderCode.toString()
                }
            });

            if (!payment) {
                this.logger.error(`Payment not found for orderCode: ${data.data.orderCode}`);
                await queryRunner.rollbackTransaction();
                return false;
            }

            const relatedOrders = await queryRunner.manager.find(Order, {
                where: {
                    payment_id: payment.id
                }
            });

            this.logger.log(`Processing PayOS callback for orderCode ${data.data.orderCode}:`, {
                payment_id: payment.id,
                payment_amount: payment.amount,
                callback_amount: data.data.amount,
                current_status: payment.status,
                callback_desc: data.data.desc,
                orders_count: relatedOrders.length
            });

            // Kiểm tra số tiền thanh toán
            if (payment.amount !== data.data.amount) {
                this.logger.error(`Amount mismatch for orderCode ${data.data.orderCode}:`, {
                    expected: payment.amount,
                    received: data.data.amount
                });
                await queryRunner.rollbackTransaction();
                return false;
            }

            // Kiểm tra trạng thái hiện tại của payment
            if (payment.status === PaymentStatus.COMPLETED) {
                this.logger.warn(`Payment already completed for orderCode: ${data.data.orderCode}`);
                await queryRunner.commitTransaction();
                return true;
            }
            
            // Kiểm tra trạng thái thanh toán trong request của payos
            if (!this.isPaymentSuccessful(data)) {
                this.logger.warn(`Payment failed for orderCode ${data.data.orderCode}: ${data.data.desc}`);

                // Update payment status to FAILED
                payment.status = PaymentStatus.FAILED;
                await queryRunner.manager.save(Payment, payment);

                //Cập nhật trạng thái đơn hàng liên quan
                if (relatedOrders.length > 0) {
                    for (const order of relatedOrders) {
                        order.status = OrderStatus.PAYMENT_FAILED;
                        await queryRunner.manager.save(Order, order);
                    }
                    this.logger.log(`Updated ${relatedOrders.length} orders to PAYMENT_FAILED status`);
                }

                await queryRunner.commitTransaction();
                return false;
            }

            //Thanh toán thành công, xóa qr code, link ảnh thanh toán
            payment.status = PaymentStatus.COMPLETED;
            payment.payment_time = new Date();
            payment.qr_code = null;
            payment.checkout_url = null;

            await queryRunner.manager.save(Payment, payment);

            if (relatedOrders.length > 0) {
                for (const order of relatedOrders) {
                    if (order.status !== OrderStatus.CANCELLED) {
                        order.status = OrderStatus.PAID;
                        await queryRunner.manager.save(Order, order);
                    }
                }
                this.logger.log(`Updated ${relatedOrders.length} orders to PAID status`);
            }

            await queryRunner.commitTransaction();

            this.logger.log(`Payment completed successfully for orderCode: ${data.data.orderCode}`, {
                payment_id: payment.id,
                amount: payment.amount,
                paid_at: payment.payment_time,
                orders_updated: relatedOrders.length
            });

            return true;

        } catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error(`Error handling PayOS callback for orderCode ${data?.data?.orderCode}:`, {
                error: error.message,
                stack: error.stack,
                data: data
            });
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    private validatePayOSCallbackData(data: PayosWebhookDto): boolean {
        if (!data) {
            this.logger.error('PayOS callback data is null or undefined');
            return false;
        }

        if (data.code !== '00') {
            this.logger.error(`PayOS callback failed with code: ${data.code}, desc: ${data.desc}`);
            return false;
        }

        if (!data.data || !data.data.orderCode || !data.data.amount) {
            this.logger.error('PayOS callback missing required data fields:', data);
            return false;
        }

        if (!data.signature) {
            this.logger.error('PayOS callback missing signature');
            return false;
        }

        return true;
    }

    private isPaymentSuccessful(data: PayosWebhookDto): boolean {
        if (data.code !== '00') {
            return false;
        }

        // PayOS success thì data.success sẽ là true
        if (data.success === false) {
            return false;
        }

        // Double check với description
        const desc = data.data.desc?.toLowerCase() || '';
        const failureKeywords = ['failed', 'thất bại', 'hủy', 'cancelled', 'error'];
        
        return !failureKeywords.some(keyword => desc.includes(keyword));
    }
}