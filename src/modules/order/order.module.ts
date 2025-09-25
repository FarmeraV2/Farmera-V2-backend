import { Module } from '@nestjs/common';
import { OrderService } from './order/order.service';
import { OrderController } from './order/order.controller';

@Module({
  providers: [OrderService],
  controllers: [OrderController]
})
export class OrderModule {}
