import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { Order } from '../entities/order.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, DataSource, FindOptionsWhere, Repository } from 'typeorm';
import { GetMyOrdersDto } from '../dtos/oder.dto';
import { PaginationMeta } from 'src/common/dtos/pagination/pagination-meta.dto';
import { OrderSortField } from '../enums/order-sort-fields.enum';
import { ResponseCode } from 'src/common/constants/response-code.const';
import { CreateBathOrderDto, CreateSingleOrderDto } from '../dtos/create-order.dto';
import { OrderDetail } from '../entities/order_detail.entity';
import { Payment } from '../entities/payment.entity';
import { Product } from 'src/modules/product/entities/product.entity';
import { OrderStatus } from '../enums/order-status.enum';
import { PaymentMethod, PaymentStatus } from '../enums/payment.enum';
import { PaymentService } from 'src/modules/payment/payment/payment.service';
import { DeliveryAddressService } from 'src/modules/address/delivery-address/delivery-address.service';

@Injectable()
export class OrderService {
    private readonly logger = new Logger(OrderService.name);
    
    constructor(
        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,
        @InjectRepository(OrderDetail)
        private readonly orderDetailRepository: Repository<OrderDetail>,
        @InjectRepository(Payment)
        private readonly paymentRepository: Repository<Payment>,
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,
        private readonly dataSource: DataSource,
        private readonly paymentService: PaymentService,
        private readonly deliveryAddressService: DeliveryAddressService,
    ) {}
    
    async getOrdersByUserId(userId: number, queryDto: GetMyOrdersDto): Promise<{ data: Order[]; meta: PaginationMeta }> {
        const {
            status,
            sort_by = OrderSortField.CREATED,
            order = 'DESC',
            page = 1,
            limit = 10,
            start_date,
            end_date,
        } = queryDto;
        const whereConditions: FindOptionsWhere<Order> = {
            cus_id: userId,
        };
        
        if (status) {
            whereConditions['status'] = status;
        }
        
        if (start_date && end_date) {
            whereConditions.created = Between(
                new Date(`${start_date}T00:00:00.000Z`),
                new Date(`${end_date}T23:59:59.999Z`)
            );
        } else if (start_date) {
            whereConditions.created = Between(
                new Date(`${start_date}T00:00:00.000Z`),
                new Date()
            );
        }
        
        const orderBy: Record<string, 'ASC' | 'DESC'> = {};
        switch (sort_by) {
            case OrderSortField.CREATED:
                orderBy['created'] = order;
                break;
            case OrderSortField.UPDATED:
                orderBy['updated'] = order;
                break;
            case OrderSortField.TOTAL_AMOUNT:
                orderBy['total_amount'] = order;
                break;
            case OrderSortField.STATUS:
                orderBy['status'] = order;
                break;
            default:
                orderBy['created'] = 'DESC';
        }
        
        const skip: number = (page - 1) * limit;
    
        const [orders, totalItems]: [Order[], number] = await this.orderRepository.findAndCount({
            where: whereConditions,
            relations:[
                'order_details',
                'order_details.product',
                'order_details.product.farm',
                'payment',
                'delivery',
                'farm'
            ],
            order: orderBy,
            skip: skip,
            take: limit,
        });
        
        const meta: PaginationMeta = new PaginationMeta({
            paginationOptions: queryDto,
            totalItems,
        });
        
        return { data: orders, meta };
    }
    
    async getOrderById(orderId: number, userId: number): Promise<Order> {
        const order = await this.orderRepository.findOne({
            where: { 
                id: orderId 
            },
            relations: [
                'order_details',
                'order_details.product',
                'order_details.product.farm',
                'payment',
                'delivery',
                'farm',
                'user'
            ]
        });

        if (!order) {
            throw new NotFoundException({
                message: 'Order not found',
                code: ResponseCode.ORDER_NOT_FOUND || 'ORDER_NOT_FOUND'
            });
        }

        if (order.cus_id !== userId) {
            throw new ForbiddenException({
                message: 'You can only access your own orders',
                code: ResponseCode.FORBIDDEN || 'FORBIDDEN'
            });
        }

        return order;
    }

    async creatBatchOders(userId: number, createBathOrderDto: CreateBathOrderDto): Promise<{
        orders: Order[];
        total_amount: number;
        payment_info?:{
            checkout_url: string;
            qr_code: string;
        };
    }> {
        
        this.logger.log(`Creating batch orders for user ${userId}: ${createBathOrderDto.orders.length} orders, payment method: ${createBathOrderDto.payment_method}`);
        
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        
        try {
            const { orders: orderDtos, payment_method, delivery_address_id } = createBathOrderDto;
            const createdOrders: Order[] = [];
            let grandTotal = 0;
            
            // Validate input data
            if (!orderDtos || orderDtos.length === 0) {
                throw new BadRequestException({
                    message: 'No orders provided',
                    code: ResponseCode.INVALID_ORDER_DATA || 'INVALID_ORDER_DATA'
                });
            }
            
            // validate delivery address
            if (!delivery_address_id) {
                throw new BadRequestException({
                    message: 'Delivery address ID is required',
                    code: ResponseCode.INVALID_ORDER_DATA || 'INVALID_ORDER_DATA'
                });
            }

            const deliveryAddress = await this.deliveryAddressService.getAddressById(delivery_address_id, userId);
            

            if (!deliveryAddress) {
                throw new NotFoundException({
                    message: 'Delivery address not found',
                    code: ResponseCode.DELIVERY_ADDRESS_NOT_FOUND || 'DELIVERY_ADDRESS_NOT_FOUND'
                });
            }

            
            // Tạo Payment record chung (PAYOS)
            let paymentStatus = PaymentStatus.UNPAID;
            if (payment_method === PaymentMethod.PAYOS) {
                paymentStatus = PaymentStatus.PENDING;
            }
            
            const sharedPayment = queryRunner.manager.create(Payment, {
                status: paymentStatus,
                method: payment_method,
                total_amount: 0,
                amount: 0,
                currency: 'VND'
            });
            
            const savedSharedPayment = await queryRunner.manager.save(sharedPayment);
            this.logger.log(`Shared payment created with ID: ${savedSharedPayment.id}`);
            
            // Xử lý từng order
            for (const [index, orderDto] of orderDtos.entries()) {
                const { farm_id, items, delivery_note, shipping_fee } = orderDto;
                
                // Validate required fields
                if (!farm_id || !items?.length || !delivery_address_id) {
                    throw new BadRequestException({
                        message: `Missing required fields in order ${index + 1}`,
                        code: ResponseCode.INVALID_ORDER_DATA || 'INVALID_ORDER_DATA'
                    });
                }
                
                let orderTotal = 0;
                const orderItems: Array<{
                    product: Product;
                    quantity: number;
                    unit_price: number;
                    total_price: number;
                    note?: string;
                }> = [];
                
                // Xử lý từng item trong order
                for (const item of items) {
                    if (!item.product_id || !item.quantity) {
                        throw new BadRequestException({
                            message: `Invalid item data in order ${index + 1}`,
                            code: ResponseCode.INVALID_ORDER_DATA || 'INVALID_ORDER_DATA'
                        });
                    }
                    
                    const product = await this.productRepository.findOne({
                        where: { 
                            product_id: item.product_id,
                            farm_id: farm_id
                        },
                        relations: ['farm']
                    });
                    
                    if (!product) {
                        throw new NotFoundException({
                            message: `Product ${item.product_id} not found in order ${index + 1}`,
                            code: ResponseCode.PRODUCT_NOT_FOUND
                        });
                    }
                    
                    if (product.stock_quantity < item.quantity) {
                        throw new BadRequestException({
                            message: `Insufficient stock for product ${product.product_name} in order ${index + 1}`,
                            code: ResponseCode.INSUFFICIENT_STOCK
                        });
                    }
                    
                    // Ensure price values are numbers
                    const unit_price = Number(product.price_per_unit);
                    const total_price = unit_price * item.quantity;
                    orderTotal += total_price;

                    orderItems.push({
                        product,
                        quantity: item.quantity,
                        unit_price,
                        total_price,
                        note: item.note
                    });
                }
                
                const finalOrderAmount = orderTotal + shipping_fee;
                grandTotal += finalOrderAmount;

                // Tạo Order
                const order = queryRunner.manager.create(Order, {
                    cus_id: userId,
                    store_id: farm_id,
                    shipping_fee: shipping_fee,
                    total_amount: finalOrderAmount,
                    status: OrderStatus.PENDING_CONFIRMATION,
                    delivery_address_id: delivery_address_id,
                    delivery_note: delivery_note,
                    payment_id: savedSharedPayment.id
                });
                
                const savedOrder = await queryRunner.manager.save(order);
                createdOrders.push(savedOrder);

                // Tạo OrderDetails
                for (const item of orderItems) {
                    const orderDetail = queryRunner.manager.create(OrderDetail, {
                        order_id: savedOrder.id,
                        product_id: item.product.product_id,
                        ordered_quantity: item.quantity,
                        weight: Number(item.product.weight_per_unit) * item.quantity,
                        unit: item.product.unit,
                        unit_price: Number(item.unit_price),
                        total_price: Number(item.total_price),
                        status: 'pending'
                    });

                    await queryRunner.manager.save(orderDetail);

                    // Cập nhật stock
                    await queryRunner.manager.update(Product, 
                        { product_id: item.product.product_id },
                        { 
                            stock_quantity: () => `stock_quantity - ${item.quantity}`,
                            total_sold: () => `total_sold + ${item.quantity}`
                        }
                    );
                }
            }
            
            // Cập nhật payment total
            await queryRunner.manager.update(Payment, 
                { id: savedSharedPayment.id },
                { 
                    total_amount: grandTotal,
                    amount: grandTotal
                }
            );

            await queryRunner.commitTransaction();
            this.logger.log(`Successfully created ${createdOrders.length} orders with total amount: ${grandTotal}`);

            // Lấy orders với relations
            const ordersWithDetails = await Promise.all(
                createdOrders.map(order => 
                    this.orderRepository.findOne({
                        where: { id: order.id },
                        relations: [
                            'order_details',
                            'order_details.product',
                            'payment',
                            'farm'
                        ]
                    })
                )
            );
            
            const validOrders = ordersWithDetails.filter(order => order !== null) as Order[];

            // PayOS logic
            let paymentInfo;
            if (payment_method === PaymentMethod.PAYOS) {
                this.logger.log(`Creating PayOS payment for ${createdOrders.length} orders, total: ${grandTotal}`);
                
                try {
                    const payosResult = await this.paymentService.createPayOSPayment(
                        savedSharedPayment.id,
                        grandTotal,
                        `Thanh toán ${createdOrders.length} đơn hàng (${createdOrders.map(o => `#${o.id}`).join(', ')})`
                    );

                    paymentInfo = {
                        checkout_url: payosResult.data.checkoutUrl,
                        qr_code: payosResult.data.qrCode
                    };

                    this.logger.log(`PayOS payment created successfully for payment ID: ${savedSharedPayment.id}`);

                } catch (payosError) {
                    this.logger.error('PayOS Error:', payosError.message);

                    // Rollback payment status
                    await this.paymentRepository.update(savedSharedPayment.id, {
                        status: PaymentStatus.FAILED
                    });
                    
                    throw new InternalServerErrorException({
                        message: `Failed to create PayOS payment: ${payosError.message}`,
                        code: ResponseCode.FAILED_TO_CREATE_PAYOS_PAYMENT || 'FAILED_TO_CREATE_PAYOS_PAYMENT'
                    });
                }
            }

            return {
                orders: validOrders,
                total_amount: grandTotal,
                payment_info: paymentInfo
            };
            
        } catch (error) {
            this.logger.error('Error creating batch orders:', error.message);
            await queryRunner.rollbackTransaction();
            
            if (error instanceof BadRequestException || 
                error instanceof NotFoundException || 
                error instanceof InternalServerErrorException) {
                throw error;
            }
            
            throw new InternalServerErrorException({
                message: `Failed to create batch orders: ${error.message}`,
                code: ResponseCode.FAILED_TO_CREATE_ORDER
            });
        } finally {
            await queryRunner.release();
        }
    }

    private async calculateShippingFee(farmId: number, deliveryAddressId?: number): Promise<number> {
        // TODO: Implement shipping fee calculation logic
        // Có thể tích hợp với API vận chuyển (GHN, GHTK, etc.)
        return 30000; // Default shipping fee
    }
    
    async getOrdersForFarmer(farmerId: number, queryDto: GetMyOrdersDto): Promise<{ data: Order[]; meta: PaginationMeta }> {
        const {
            status,
            sort_by = OrderSortField.CREATED,
            order = 'DESC',
            page = 1,
            limit = 10,
            start_date,
            end_date,
        } = queryDto;
        const whereConditions: FindOptionsWhere<Order> = {
            store_id: farmerId,
        };
        
        if (status) {
            whereConditions['status'] = status;
        }
        
        if (start_date && end_date) {
            whereConditions.created = Between(
                new Date(`${start_date}T00:00:00.000Z`),
                new Date(`${end_date}T23:59:59.999Z`)
            );
        } else if (start_date) {
            whereConditions.created = Between(
                new Date(`${start_date}T00:00:00.000Z`),
                new Date()
            );
        }
        
        const orderBy: Record<string, 'ASC' | 'DESC'> = {};
        switch (sort_by) {
            case OrderSortField.CREATED:
                orderBy['created'] = order;
                break;
            case OrderSortField.UPDATED:
                orderBy['updated'] = order;
                break;
            case OrderSortField.TOTAL_AMOUNT:
                orderBy['total_amount'] = order;
                break;
            case OrderSortField.STATUS:
                orderBy['status'] = order;
                break;
            default:
                orderBy['created'] = 'DESC';
        }
        
        const skip: number = (page - 1) * limit;
    
        const [orders, totalItems]: [Order[], number] = await this.orderRepository.findAndCount({
            where: whereConditions,
            relations:[
                'order_details',
                'order_details.product',
                'order_details.product.farm',
                'payment',
                'delivery',
                'farm'
            ],
            order: orderBy,
            skip: skip,
            take: limit,
        });
        
        const meta: PaginationMeta = new PaginationMeta({
            paginationOptions: queryDto,
            totalItems,
        });
        
        return { data: orders, meta };
    }

}
