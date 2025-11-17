import { Module } from '@nestjs/common';
import { PaymentService } from './payment/payment.service';
import { PaymentController } from './payment/payment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from '../order/entities/payment.entity';
import { HttpModule } from '@nestjs/axios';
import { PayosService } from './payment/payos.service';
import { Order } from '../order/entities/order.entity';

@Module({
    imports: [
            TypeOrmModule.forFeature([
                Payment,
                Order,
            ]),
            HttpModule
        ],
    providers: [PaymentService, PayosService],
    controllers: [PaymentController],
    exports: [PaymentService, PayosService],
})
export class PaymentModule {}
