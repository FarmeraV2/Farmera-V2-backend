import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Logger, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ResponseCode } from 'src/common/constants/response-code.const';
import { Public } from 'src/common/decorators/public.decorator';
import { Roles } from 'src/common/decorators/role.decorator';
import { User } from 'src/common/decorators/user.decorator';
import { UserRole } from 'src/common/enums/role.enum';
import { UserInterface } from 'src/common/types/user.interface';
import { FarmService } from 'src/modules/farm/farm/farm.service';
import { CreateBatchOrderDto } from '../dtos/create-order.dto';
import { GetMyOrdersDto } from '../dtos/oder.dto';
import { OrderService } from './order.service';
import { CalculateShippingFeeRequestDto } from '../dtos/calculate-shipping-fee.request.dto';
import { ConfirmOrderDeliveryDto } from '../dtos/confirm-order-delivery.dto';
import { GhnRequiredNote } from 'src/modules/address/dtos/ghn-create-delivery.dto';
import { GhnWebhookDto } from '../dtos/ghn-webhook.dto';

@Controller('order')
export class OrderController {
    private readonly logger = new Logger(OrderController.name);
    constructor(
        private readonly orderService: OrderService,
        private readonly farmService: FarmService,
    ) { }

    @Get('my-orders')
    @Roles([UserRole.BUYER, UserRole.FARMER])
    async getMyOrders(@User() user: UserInterface, @Query() queryDto: GetMyOrdersDto) {
        const userId = user.id;
        return await this.orderService.getOrdersByUserId(userId, queryDto);
    }

    @Get(':order_id')
    @Roles([UserRole.BUYER, UserRole.FARMER])
    async getOrderById(@User() user: UserInterface, @Param('order_id', ParseIntPipe) orderId: number) {
        const userId = user.id;
        return await this.orderService.getOrderById(orderId, userId);
    }


    @Post()
    @Roles([UserRole.BUYER, UserRole.FARMER])
    async createOrder(@User() user: UserInterface, @Body() createBatchOrderDto: CreateBatchOrderDto) {
        const userId = user.id;
        return await this.orderService.creatBatchOders(userId, createBatchOrderDto);
    }


    @Get('farmer/orders')
    @Roles([UserRole.FARMER])
    async getOrdersForFarmer(@User() user: UserInterface, @Query() queryDto: GetMyOrdersDto) {
        if (!user.farm_id) {
            throw new BadRequestException({
                message: 'No farm found for this farmer',
                code: ResponseCode.FARM_NOT_FOUND || 'FARM_NOT_FOUND',
            });
        }
        const farmerID = user.farm_id;
        return await this.orderService.getOrdersForFarmer(farmerID, queryDto);
    }

    @Get('farmer/orders/:order_id')
    @Roles([UserRole.FARMER])
    async getOrderByIdForFarmer(@User() user: UserInterface, @Param('order_id', ParseIntPipe) orderId: number) {
        if (!user.farm_id) {
            throw new BadRequestException({
                message: 'No farm found for this farmer',
                code: ResponseCode.FARM_NOT_FOUND || 'FARM_NOT_FOUND',
            });
        }
        const farmerID = user.farm_id;
        return await this.orderService.getOrderByIdForFarmer(orderId, farmerID);
    }

    @Post('calculate-shipping-fee')
    @Roles([UserRole.BUYER, UserRole.FARMER])
    async calculateShippingFee(@User() user: UserInterface, @Body() calculateShippingFeeRequestDto: CalculateShippingFeeRequestDto) {
        const userId = user.id;
        return await this.orderService.calculateShippingFee(userId, calculateShippingFeeRequestDto);
    }

    @Post('farmer/create-delivery-order/:order_id')
    @Roles([UserRole.FARMER])
    async createDeliveryOrderForOrder(
        @User() user: UserInterface,
        @Param('order_id', ParseIntPipe) orderId: number,
        @Body() confirmDto: ConfirmOrderDeliveryDto,
    ) {
        if (!user.farm_id) {
            throw new BadRequestException({
                message: 'No farm found for this farmer',
                code: ResponseCode.FARM_NOT_FOUND || 'FARM_NOT_FOUND',
            });
        }
        const farmerID = user.farm_id;
        return await this.orderService.confirmOrderDelivery(
            orderId, 
            farmerID, 
            confirmDto.shipping_carrier,
            confirmDto.required_note || GhnRequiredNote.KHONG_CHO_XEM_HANG
        );
    }

    @Post('webhook/ghn')
    @Public()
    @HttpCode(HttpStatus.OK)
    async handleGhnWebhook(@Body() webhookDto: GhnWebhookDto) {
        this.logger.log(`Received GHN webhook: Type=${webhookDto.Type}, OrderCode=${webhookDto.OrderCode}, Status=${webhookDto.Status}`);
        try {
            await this.orderService.handleGhnWebhook(webhookDto);
            return { success: true };
        } catch (error) {
            this.logger.error(`Error processing GHN webhook: ${error.message}`, error.stack);
            return { success: false, error: error.message };
        }
    }

    @Post('delivery/:delivery_id/sync-from-ghn')
    @Roles([UserRole.FARMER, UserRole.BUYER])
    async updateDeliveryFromGHN(
        @User() user: UserInterface,
        @Param('delivery_id', ParseIntPipe) deliveryId: number
    ) {
        return await this.orderService.updateDeliveryFromGHN(deliveryId);
    }
    
    @Post('farmer/orders/:order_id/confirm')
    @Roles([UserRole.FARMER])
    async confirmOrder(@User() user: UserInterface, @Param('order_id', ParseIntPipe) orderId: number) {
        if (!user.farm_id) {
            throw new BadRequestException({
                message: 'No farm found for this farmer',
                code: ResponseCode.FARM_NOT_FOUND || 'FARM_NOT_FOUND',
            });
        }
        const farmerID = user.farm_id;
        return await this.orderService.farmerConfirmOrder(orderId, farmerID);
    }
    
    @Post('farmer/orders/:order_id/cancel')
    @Roles([UserRole.FARMER])
    async cancelOrder(@User() user: UserInterface, @Param('order_id', ParseIntPipe) orderId: number) {
        if (!user.farm_id) {
            throw new BadRequestException({
                message: 'No farm found for this farmer',
                code: ResponseCode.FARM_NOT_FOUND || 'FARM_NOT_FOUND',
            });
        }
        const farmerID = user.farm_id;
        return await this.orderService.farmerCancelOrder(orderId, farmerID);
    }
    
    
    // @Post(':order_id/generate-qr')
    // @Roles([UserRole.FARMER])
    // async generateQR(@User() user: UserInterface, @Param('order_id', ParseIntPipe) orderId: number) {
    //     if (!user.farm_id) {
    //         throw new BadRequestException({
    //             message: 'No farm found for this farmer',
    //             code: ResponseCode.FARM_NOT_FOUND || 'FARM_NOT_FOUND',
    //         });
    //     }
    //     const farmerID = user.farm_id;
    //     return await this.orderService.generateQRForOrder(orderId, farmerID);
    // }

    @Post(':order_id/confirm-received')
    @Roles([UserRole.BUYER, UserRole.FARMER])
    async confirmOrderReceived(@User() user: UserInterface, @Param('order_id', ParseIntPipe) orderId: number) {
        const userId = user.id;
        return await this.orderService.buyerConfirmReceived(orderId, userId);
    }

    @Get('details/qr/:qr_token')
    @Public()
    async getOrderDetailsByQR(@Param('qr_token') qrToken: string) {
        return await this.orderService.getOrderDetailsByQR(qrToken);
    }
}
