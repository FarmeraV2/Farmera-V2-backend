import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, Req } from '@nestjs/common';
import { OrderService } from './order.service';
import { Roles } from 'src/common/decorators/role.decorator';
import { UserRole } from 'src/common/enums/role.enum';
import { GetMyOrdersDto } from '../dtos/oder.dto';
import { UserInterface } from 'src/common/types/user.interface';
import { User } from 'src/common/decorators/user.decorator';
import { CreateBathOrderDto, CreateSingleOrderDto } from '../dtos/create-order.dto';

@Controller('order')
export class OrderController {
    
    constructor(private readonly orderService: OrderService) { }
    
    @Get('my-orders')
    @Roles([UserRole.BUYER])
    async getMyOrders(@User() user: UserInterface, @Query() queryDto: GetMyOrdersDto) {
        const userId = user.id;
        return await this.orderService.getOrdersByUserId(userId, queryDto);
    }
    
    @Get(':order_id')
    @Roles([UserRole.BUYER])
    async getOrderById(@User() user: UserInterface, @Param('order_id', ParseIntPipe) orderId: number) {
        const userId = user.id;
        return await this.orderService.getOrderById(orderId, userId);
    }
    
    
    @Post()
    @Roles([UserRole.BUYER])
    async createOrder(@User() user: UserInterface, @Body() createBathOrderDto: CreateBathOrderDto) {
        const userId = user.id;
        return await this.orderService.creatBatchOders(userId, createBathOrderDto);
    }
}
