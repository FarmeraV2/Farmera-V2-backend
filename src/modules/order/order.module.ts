import { Module } from '@nestjs/common';
import { OrderService } from './order/order.service';
import { OrderController } from './order/order.controller';
import { Delivery } from './entities/delivery.entity';
import { Payment } from './entities/payment.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderDetail } from './entities/order_detail.entity';
import { Product } from '../product/entities/product.entity';
import { PaymentModule } from '../payment/payment.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Order,
            OrderDetail,
            Payment,
            Delivery,
            Product,
        ]),
        PaymentModule
    ],
    providers: [OrderService],
    controllers: [OrderController],
    exports: [OrderService],
})
export class OrderModule {}
