import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ResponseCode } from 'src/common/constants/response-code.const';
import { PaginationMeta } from 'src/common/dtos/pagination/pagination-meta.dto';
import { DeliveryAddressService } from 'src/modules/address/delivery-address/delivery-address.service';
import { PaymentService } from 'src/modules/payment/payment/payment.service';
import { Product } from 'src/modules/product/entities/product.entity';
import { ProductStatus } from 'src/modules/product/enums/product-status.enum';
import { Between, DataSource, FindOptionsWhere, Repository } from 'typeorm';
import { CalculateShippingFeeRequestDto } from '../dtos/calculate-shipping-fee.request.dto';
import { CreateBatchOrderDto } from '../dtos/create-order.dto';
import { GetMyOrdersDto, OrderDto } from '../dtos/oder.dto';
import { Order } from '../entities/order.entity';
import { OrderDetail } from '../entities/order_detail.entity';
import { Payment } from '../entities/payment.entity';
import { OrderSortField } from '../enums/order-sort-fields.enum';
import { OrderStatus } from '../enums/order-status.enum';
import { PaymentMethod, PaymentStatus } from '../enums/payment.enum';
import { DeliveryAddressDto } from 'src/modules/address/dtos/delivery-address.dto';
import { FarmService } from 'src/modules/farm/farm/farm.service';
import { CalculateShippingFeeDto } from 'src/modules/address/dtos/calculate-shipping-fee.dto';
import { GHNService } from 'src/modules/address/ghn/ghn.service';
import { plainToInstance } from 'class-transformer';
import { CreateGhnOrderDto, GhnPaymentTypeId, GhnRequiredNote } from 'src/modules/address/dtos/ghn-create-delivery.dto';
import { Delivery } from '../entities/delivery.entity';
import { DeliveryPaymentType, DeliveryRequiredNote, DeliveryStatus } from '../enums/delivery-status.enum';
import { GhnWebhookDto, GhnOrderStatus, GhnWebhookType } from '../dtos/ghn-webhook.dto';

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
        @InjectRepository(Delivery)
        private readonly deliveryRepository: Repository<Delivery>,
        private readonly dataSource: DataSource,
        private readonly paymentService: PaymentService,
        private readonly deliveryAddressService: DeliveryAddressService,
        private readonly farmService: FarmService,
        private readonly GHNService: GHNService,
    ) { }

    private async validateAndGetDeliveryAddress(userId: number, addressId?: number): Promise<DeliveryAddressDto> {
        let deliveryAddressId = addressId;

        if (!deliveryAddressId) {
            const defaultAddress = await this.deliveryAddressService.getDefaultAddress(userId);
            if (!defaultAddress) {
                throw new BadRequestException({
                    message: 'No delivery address found. Please add an address first.',
                    code: ResponseCode.ADDRESS_NOT_FOUND
                });
            }
            deliveryAddressId = defaultAddress.address_id;
            return defaultAddress;
        }
        const deliveryAddress = await this.deliveryAddressService.getAddressById(deliveryAddressId);
        if (!deliveryAddress) {
            throw new NotFoundException({
                message: 'Delivery address not found',
                code: ResponseCode.DELIVERY_ADDRESS_NOT_FOUND
            });
        }

        return deliveryAddress;
    }

    async getOrdersByUserId(userId: number, queryDto: GetMyOrdersDto): Promise<{ data: OrderDto[]; meta: PaginationMeta }> {
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
            relations: [
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

        const orderDtos = plainToInstance(OrderDto, orders, { excludeExtraneousValues: true });

        return { data: orderDtos, meta };
    }

    async getOrderById(orderId: number, userId: number): Promise<OrderDto> {
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
                'delivery_address',
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

        return plainToInstance(OrderDto, order, { excludeExtraneousValues: true });
    }

    async creatBatchOders(userId: number, CreateBatchOrderDto: CreateBatchOrderDto): Promise<{
        orders: OrderDto[];
        total_amount: number;
        payment_info?: {
            checkout_url: string;
            qr_code: string;
        };
    }> {

        this.logger.log(`Creating batch orders for user ${userId}: ${CreateBatchOrderDto.orders.length} orders, payment method: ${CreateBatchOrderDto.payment_method}`);

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const { orders: orderDtos, payment_method } = CreateBatchOrderDto;
            let deliveryAddressId = CreateBatchOrderDto.delivery_address_id;


            // Validate input data
            if (!orderDtos || orderDtos.length === 0) {
                throw new BadRequestException({
                    message: 'No orders provided',
                    code: ResponseCode.INVALID_ORDER_DATA
                });
            }

            // Validate delivery address
            deliveryAddressId = (await this.validateAndGetDeliveryAddress(userId, deliveryAddressId)).address_id;

            const validationErrors: Array<{
                order_index: number;
                item_index: number;
                product_id: number;
                product_name?: string;
                error_code: string;
                message: string;
                available_quantity?: number;
                requested_quantity?: number;
            }> = [];

            const validOrderItems: Array<{
                orderIndex: number;
                product: Product;
                quantity: number;
                unit_price: number;
                total_price: number;
                // note?: string;
            }> = [];

            const productUpdates: Array<{
                product_id: number;
                quantity: number;
            }> = [];

            const orderTotals: number[] = [];
            let grandTotal = 0;

            for (const [orderIndex, orderDto] of orderDtos.entries()) {
                const { farm_id, items, shipping_fee } = orderDto;

                if (!farm_id || !items?.length) {
                    throw new BadRequestException({
                        message: `Missing required fields in order ${orderIndex + 1}`,
                        code: ResponseCode.INVALID_ORDER_DATA
                    });
                }

                // Validate farm exists
                const farm = await this.farmService.findFarmById(farm_id);
                if (!farm) {
                    throw new NotFoundException({
                        message: `Farm ${farm_id} not found`,
                        code: ResponseCode.FARM_NOT_FOUND
                    });
                }
                // TODO: Kiểm tra status của farm (VERIFIED/APPROVED) trước khi cho phép đặt hàng

                let orderTotal = 0;

                for (const [itemIndex, item] of items.entries()) {
                    if (!item.product_id || !item.quantity || item.quantity <= 0) {
                        validationErrors.push({
                            order_index: orderIndex + 1,
                            item_index: itemIndex + 1,
                            product_id: item.product_id,
                            error_code: ResponseCode.INVALID_ORDER_DATA,
                            message: 'Invalid item data (missing product_id or invalid quantity)'
                        });
                        continue;
                    }

                    const product = await queryRunner.manager
                        .createQueryBuilder(Product, 'product')
                        .setLock('pessimistic_write')
                        .where('product.product_id = :id', { id: item.product_id })
                        .andWhere('product.farm_id = :farmId', { farmId: farm_id })
                        .getOne();

                    if (!product) {
                        validationErrors.push({
                            order_index: orderIndex + 1,
                            item_index: itemIndex + 1,
                            product_id: item.product_id,
                            error_code: ResponseCode.PRODUCT_NOT_FOUND,
                            message: `Product ${item.product_id} not found`
                        });
                        continue;
                    }

                    if (product.status !== ProductStatus.OPEN_FOR_SALE) {
                        validationErrors.push({
                            order_index: orderIndex + 1,
                            item_index: itemIndex + 1,
                            product_id: item.product_id,
                            product_name: product.product_name,
                            error_code: ResponseCode.PRODUCT_NOT_OPEN_FOR_SALE,
                            message: `Product "${product.product_name}" is not available for sale`
                        });
                        continue;
                    }

                    if (product.stock_quantity < item.quantity) {
                        validationErrors.push({
                            order_index: orderIndex + 1,
                            item_index: itemIndex + 1,
                            product_id: item.product_id,
                            product_name: product.product_name,
                            available_quantity: product.stock_quantity,
                            requested_quantity: item.quantity,
                            error_code: ResponseCode.INSUFFICIENT_STOCK,
                            message: `Insufficient stock for "${product.product_name}". Available: ${product.stock_quantity}, Requested: ${item.quantity}`
                        });
                        continue;
                    }

                    const unit_price = Number(product.price_per_unit);
                    const total_price = unit_price * item.quantity;
                    orderTotal += total_price;

                    validOrderItems.push({
                        orderIndex,
                        product,
                        quantity: item.quantity,
                        unit_price,
                        total_price,
                        // note: item.note
                    });

                    productUpdates.push({
                        product_id: product.product_id,
                        quantity: item.quantity
                    });
                }

                // Tính tổng tiền cho order này (sau khi loop hết items)
                const finalOrderAmount = orderTotal + shipping_fee;
                orderTotals.push(finalOrderAmount);
                grandTotal += finalOrderAmount;
            }

            if (validationErrors.length > 0) {
                await queryRunner.rollbackTransaction();

                const hasStockIssues = validationErrors.some(
                    e => e.error_code === ResponseCode.INSUFFICIENT_STOCK
                );

                throw new BadRequestException({
                    message: hasStockIssues
                        ? 'Some products are out of stock or have insufficient quantity'
                        : 'Validation errors in order items',
                    code: ResponseCode.INVALID_ORDER_DATA,
                    details: validationErrors,
                    has_stock_issues: hasStockIssues
                });
            }

            const paymentStatus = payment_method === PaymentMethod.PAYOS
                ? PaymentStatus.PENDING
                : PaymentStatus.UNPAID;

            const sharedPayment = queryRunner.manager.create(Payment, {
                status: paymentStatus,
                method: payment_method,
                total_amount: grandTotal,
                amount: grandTotal,
                currency: 'VND'
            });

            const savedSharedPayment = await queryRunner.manager.save(sharedPayment);
            this.logger.log(`Payment created with ID: ${savedSharedPayment.id}`);

            for (const update of productUpdates) {
                await queryRunner.manager.update(
                    Product,
                    { product_id: update.product_id },
                    {
                        stock_quantity: () => `stock_quantity - ${update.quantity}`,
                        total_sold: () => `total_sold + ${update.quantity}`
                    }
                );
            }

            const createdOrders: Order[] = [];
            const itemsByOrder = validOrderItems.reduce((acc, item) => {
                if (!acc[item.orderIndex]) acc[item.orderIndex] = [];
                acc[item.orderIndex].push(item);
                return acc;
            }, {} as Record<number, typeof validOrderItems>);

            for (const [orderIndex, orderDto] of orderDtos.entries()) {
                const items = itemsByOrder[orderIndex];
                if (!items || items.length === 0) continue;

                const { farm_id, delivery_note, shipping_fee } = orderDto;

                const order = queryRunner.manager.create(Order, {
                    cus_id: userId,
                    store_id: farm_id,
                    shipping_fee,
                    total_amount: orderTotals[orderIndex],
                    status: OrderStatus.PENDING_CONFIRMATION,
                    delivery_address_id: deliveryAddressId,
                    delivery_note,
                    payment_id: savedSharedPayment.id
                });

                const savedOrder = await queryRunner.manager.save(order);
                createdOrders.push(savedOrder);

                for (const item of items) {
                    const orderDetail = queryRunner.manager.create(OrderDetail, {
                        order_id: savedOrder.id,
                        product_id: item.product.product_id,
                        ordered_quantity: item.quantity,
                        weight: Number(item.product.weight_per_unit) * item.quantity,
                        unit: item.product.unit,
                        unit_price: item.unit_price,
                        total_price: item.total_price,
                        status: 'pending'
                    });

                    await queryRunner.manager.save(orderDetail);
                }
            }

            await queryRunner.commitTransaction();
            this.logger.log(`Successfully created ${createdOrders.length} orders with total: ${grandTotal}`);

            const ordersWithDetails = await Promise.all(
                createdOrders.map(order =>
                    this.orderRepository.findOne({
                        where: { id: order.id },
                        relations: ['order_details', 'order_details.product', 'payment', 'delivery_address', 'farm']
                    })
                )
            );

            const validOrders = ordersWithDetails.filter(order => order !== null) as Order[];

            // if payment method is PayOS, create payment link
            let paymentInfo: { checkout_url: string; qr_code: string; } | undefined = undefined;
            if (payment_method === PaymentMethod.PAYOS) {
                try {
                    const payosResult = await this.paymentService.createPayOSPayment(
                        savedSharedPayment.id,
                        grandTotal,
                        `Thanh toan don hang Farmera`
                    );

                    paymentInfo = {
                        checkout_url: payosResult.data.checkoutUrl,
                        qr_code: payosResult.data.qrCode
                    };
                } catch (payosError) {
                    this.logger.error('PayOS Error:', payosError.message);
                    await this.paymentRepository.update(savedSharedPayment.id, {
                        status: PaymentStatus.FAILED
                    });

                    throw new InternalServerErrorException({
                        message: `Failed to create PayOS payment: ${payosError.message}`,
                        code: ResponseCode.FAILED_TO_CREATE_PAYOS_PAYMENT
                    });
                }
            }

            const orderDtoResults = plainToInstance(OrderDto, validOrders, { excludeExtraneousValues: true });

            return {
                orders: orderDtoResults,
                total_amount: grandTotal,
                payment_info: paymentInfo
            };

        } catch (error) {
            this.logger.error('Error creating batch orders:', error.message);

            if (queryRunner.isTransactionActive) {
                await queryRunner.rollbackTransaction();
            }

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



    async calculateShippingFee(
        userId: number,
        calculateDto: CalculateShippingFeeRequestDto
    ): Promise<{
        shipping_fee: number;
        shipping_carrier?: string;
        estimated_delivery_time?: string;
        total_weight: number;
        total_price: number;
    }> {
        const { delivery_address_id, farm_id, products, shipping_carrier } = calculateDto;

        // Lấy địa chỉ người nhận to address
        const deliveryAddress = await this.validateAndGetDeliveryAddress(userId, delivery_address_id);

        this.logger.log(`Delivery address for user 11111111111111 ${userId}: ${JSON.stringify(deliveryAddress)}`);
        // Lấy địa chỉ cửa hàng from address
        const farm = await this.farmService.findFarmById(farm_id);
        if (!farm?.address) {
            throw new NotFoundException({
                message: `Farm ${farm_id} or farm address not found`,
                code: ResponseCode.FARM_NOT_FOUND
            });
        }
        // TODO: Kiểm tra status của farm (VERIFIED/APPROVED)
        const farmAddress = farm.address;

        //Tính trọng lượng và giá trị đơn hàng
        let totalWeight = 0;
        let totalPrice = 0;
        const productItems: Array<{
            name: string;
            code: string;
            quantity: number;
            price: number;
            weight: number;
        }> = [];

        for (const item of products) {
            const product = await this.productRepository.findOne({
                where: {
                    product_id: item.product_id,
                    farm_id: farm_id
                }
            });

            if (!product) {
                throw new NotFoundException({
                    message: `Product ${item.product_id} not found in farm ${farm_id}`,
                    code: ResponseCode.PRODUCT_NOT_FOUND
                });
            }

            if (product.status !== ProductStatus.OPEN_FOR_SALE) {
                throw new BadRequestException({
                    message: `Product "${product.product_name}" is not available for sale`,
                    code: ResponseCode.PRODUCT_NOT_OPEN_FOR_SALE
                });
            }

            const itemWeight = Number(product.weight_per_unit || 0) * item.quantity;
            const itemPrice = Number(product.price_per_unit || 0) * item.quantity;

            totalWeight += itemWeight;
            totalPrice += itemPrice;

            productItems.push({
                name: product.product_name || `Product ${product.product_id}`,
                code: `P${product.product_id}`,
                quantity: item.quantity,
                price: itemPrice,
                weight: itemWeight
            });
        }

        //Tính phí vận chuyển
        let shippingFee = 0;
        let estimatedTime = '2-3 ngày';
        const selectedCarrier = shipping_carrier || 'GHN';

        // TODO: Tích hợp API GHN/GHTK
        if(farmAddress.old_district?.ghn_code == null || farmAddress.old_ward?.ghn_code == null) {
            throw new BadRequestException({
                message: 'Farm address does not support delivery by GHN',
                code: ResponseCode.INVALID_ADDRESS_DATA
            });
        }
        if(deliveryAddress.old_district?.ghn_code == null || deliveryAddress.old_ward?.ghn_code == null) {
            throw new BadRequestException({
                message: 'Delivery address does not support delivery by GHN',
                code: ResponseCode.INVALID_ADDRESS_DATA
            });
        }
        if (selectedCarrier === 'GHN') {
            try {
                const ghnRequest: CalculateShippingFeeDto = {
                    from_district_id: Number(farmAddress.old_district.ghn_code) || 0,
                    from_ward_code: farmAddress.old_ward.ghn_code?.toString() || '',
                    to_district_id: Number(deliveryAddress.old_district.ghn_code) || 0,
                    to_ward_code: deliveryAddress.old_ward.ghn_code?.toString() || '',
                    weight: totalWeight,
                    length: 0,
                    width: 0,
                    height: 0,
                    insurance_value: totalPrice,
                    coupon: '',
                    cod_amount: 0,
                    content: 'San pham nong san',
                    items: productItems
                };

                const ghnResult = await this.GHNService.calculateShippingFeeViaGHN(ghnRequest);
                shippingFee = ghnResult.total;
                // estimatedTime = ghnResult.expected_delivery_time;
            } catch (error) {
                this.logger.warn(`Failed to calculate GHN fee: ${error.message}. Using default fee.`);
                throw new BadRequestException({
                    message: `Failed to calculate shipping fee via GHN: ${error.message}`,
                    code: ResponseCode.FAILED_TO_CALCULATE_SHIPPING_FEE
                });
            }
        }

        return {
            shipping_fee: shippingFee,
            shipping_carrier: selectedCarrier,
            estimated_delivery_time: estimatedTime,
            total_weight: totalWeight,
            total_price: totalPrice
        };
    }

    async getOrdersForFarmer(farmerId: number, queryDto: GetMyOrdersDto): Promise<{ data: OrderDto[]; meta: PaginationMeta }> {
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
            relations: [
                'order_details',
                'order_details.product',
                'order_details.product.farm',
                'payment',
                'delivery',
                'delivery_address',
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

        const orderDtos = plainToInstance(OrderDto, orders, { excludeExtraneousValues: true });

        return { data: orderDtos, meta };
    }

    async getOrderShippingInfo(
        orderId: number,
        options?: {
            shipping_carrier?: string;
            include_address_code?: boolean;
            include_address_detail?: boolean;
        }
    ): Promise<{
        order: OrderDto;
        client_order_code: string;
        shipping_carrier?: string;
        sender: {
            name: string;
            phone: string;
            address: string;
            old_ward_code?: string;
            old_ward_name?: string;
            old_district_id?: number;
            old_district_name?: string;
            old_province_id?: number;
            old_province_name?: string;
            province_code?: number; // la dia chi moi
            province_name?: string;
            ward_code?: string;
            ward_name?: string;
        };
        receiver: {
            name: string;
            phone: string;
            address: string;
            old_ward_code?: string;
            old_ward_name?: string;
            old_district_id?: number;
            old_district_name?: string;
            old_province_id?: number;
            old_province_name?: string;
            province_code?: number;
            province_name?: string;
            ward_code?: string;
            ward_name?: string;
        };
        products: Array<{
            name: string;
            code: string;
            quantity: number;
            price: number;
            weight: number;
        }>;
        total_weight: number;
        total_value: number;
        shipping_fee: number;
    }> {
        const includeCode = options?.include_address_code ?? true;
        const includeDetail = options?.include_address_detail ?? true;
        const shippingCarrier = options?.shipping_carrier || 'GHN';

        const order = await this.orderRepository.findOne({
            where: { id: orderId },
            relations: [
                'farm',
                'farm.address',
                'farm.address.old_province',
                'farm.address.old_district',
                'farm.address.old_ward',
                'farm.address.province',
                'farm.address.ward',
                'delivery_address',
                'delivery_address.old_province',
                'delivery_address.old_district',
                'delivery_address.old_ward',
                'delivery_address.province',
                'delivery_address.ward',
                'order_details',
                'order_details.product',
                'payment',
                'delivery'
            ]
        });

        if (!order) {
            throw new NotFoundException({
                message: 'Order not found',
                code: ResponseCode.ORDER_NOT_FOUND
            });
        }

        if (!order.farm || !order.farm.address) {
            throw new BadRequestException({
                message: 'Farm or farm address not found for this order',
                code: ResponseCode.FARM_NOT_FOUND
            });
        }

        if (!order.delivery_address) {
            throw new BadRequestException({
                message: 'Delivery address not found for this order',
                code: ResponseCode.DELIVERY_ADDRESS_NOT_FOUND
            });
        }

        const farmAddress = order.farm.address;
        const deliveryAddress = order.delivery_address;

        let totalWeight = 0;
        let totalValue = 0;
        const products = order.order_details.map(detail => {
            const itemWeight = Number(detail.product.weight_per_unit || 0) * detail.ordered_quantity;
            const itemPrice = Number(detail.unit_price) * detail.ordered_quantity;

            totalWeight += itemWeight;
            totalValue += itemPrice;

            return {
                name: detail.product.product_name || `Product ${detail.product.product_id}`,
                code: `P${detail.product.product_id}`,
                quantity: detail.ordered_quantity,
                price: itemPrice,
                weight: itemWeight
            };
        });

        const senderInfo: any = {
            name: order.farm.farm_name,
            phone: order.farm.phone,
            address: farmAddress.street
        };

        const receiverInfo: any = {
            name: deliveryAddress.name,
            phone: deliveryAddress.phone,
            address: deliveryAddress.street
        };

        if (includeCode) {
            senderInfo.old_ward_code = farmAddress.old_ward?.ghn_code?.toString();
            senderInfo.old_district_id = Number(farmAddress.old_district?.ghn_code);
            senderInfo.old_province_id = Number(farmAddress.old_province?.ghn_code);
            senderInfo.province_code = Number(farmAddress.province?.ghn_code);
            senderInfo.ward_code = farmAddress.ward?.ghn_code?.toString();

            receiverInfo.old_ward_code = deliveryAddress.old_ward?.ghn_code?.toString();
            receiverInfo.old_district_id = Number(deliveryAddress.old_district?.ghn_code);
            receiverInfo.old_province_id = Number(deliveryAddress.old_province?.ghn_code);
            receiverInfo.province_code = Number(deliveryAddress.province?.ghn_code);
            receiverInfo.ward_code = deliveryAddress.ward?.ghn_code?.toString();
        }

        if (includeDetail) {
            senderInfo.old_ward_name = farmAddress.old_ward?.name;
            senderInfo.old_district_name = farmAddress.old_district?.name;
            senderInfo.old_province_name = farmAddress.old_province?.name;
            senderInfo.province_name = farmAddress.province?.name;
            senderInfo.ward_name = farmAddress.old_ward?.name;

            receiverInfo.old_ward_name = deliveryAddress.old_ward?.name;
            receiverInfo.old_district_name = deliveryAddress.old_district?.name;
            receiverInfo.old_province_name = deliveryAddress.old_province?.name;
            receiverInfo.province_name = deliveryAddress.province?.name;
            receiverInfo.ward_name = deliveryAddress.ward?.name;
        }

        const orderDto = plainToInstance(OrderDto, order, { excludeExtraneousValues: true });

        return {
            order: orderDto,
            client_order_code: `ORDER-${order.id}`,
            shipping_carrier: shippingCarrier,
            sender: senderInfo,
            receiver: receiverInfo,
            products,
            total_weight: totalWeight,
            total_value: totalValue,
            shipping_fee: order.shipping_fee
        };
    }


    async confirmOrderDelivery(
        orderId: number, 
        farmerId: number, 
        shipping_carrier: string,
        required_note: GhnRequiredNote
    ): Promise<OrderDto> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const data = await this.getOrderShippingInfo(orderId, {
                shipping_carrier: shipping_carrier,
                include_address_code: true,
                include_address_detail: true
            });
            
            if (!data.order) {
                throw new NotFoundException({
                    message: 'Order not found',
                    code: ResponseCode.ORDER_NOT_FOUND
                });
            }

            this.logger.log(`Fetched shipping info for order ${orderId}: ${JSON.stringify(data)}`);
            this.logger.log(`farmerId: ${farmerId}, order.store_id: ${data.order.farm?.id}`);
            if (data.order.store_id !== farmerId) {
                throw new ForbiddenException({
                    message: 'You can only confirm orders from your own farm',
                    code: ResponseCode.FORBIDDEN
                });
            }

            if (data.order.status !== OrderStatus.PENDING_CONFIRMATION) {
                throw new BadRequestException({
                    message: 'Order is not in pending confirmation status',
                    code: ResponseCode.INVALID_ORDER_STATUS
                });
            }

            if (data.order.delivery) {
                throw new BadRequestException({
                    message: 'Order already has delivery information',
                    code: ResponseCode.DELIVERY_ALREADY_EXISTS
                });
            }

            this.logger.log(`Farm ${farmerId} confirming order ${orderId}`);
            this.logger.log(`Sender address: ${JSON.stringify(data.sender)}`);
            this.logger.log(`Receiver address: ${JSON.stringify(data.receiver)}`);

            // Xác định payment type dựa vào phương thức thanh toán
            // COD (UNPAID) -> Người nhận thanh toán
            // PayOS (đã thanh toán hoặc PENDING) -> Người gửi thanh toán
            const isCOD = data.order.payment.status === PaymentStatus.UNPAID;
            const codAmount = isCOD ? Math.round(data.total_value + data.shipping_fee) : 0;
            const paymentTypeId = isCOD ? GhnPaymentTypeId.NGUOI_NHAN_THANH_TOAN : GhnPaymentTypeId.NGUOI_GUI_THANH_TOAN;

            // Map required_note từ GhnRequiredNote sang DeliveryRequiredNote
            let deliveryRequiredNote: DeliveryRequiredNote;
            switch (required_note) {
                case GhnRequiredNote.CHO_THU_HANG:
                    deliveryRequiredNote = DeliveryRequiredNote.CHOTHUHANG;
                    break;
                case GhnRequiredNote.CHO_XEM_HANG_KHONG_THU:
                    deliveryRequiredNote = DeliveryRequiredNote.CHOXEMHANGKHONGTHU;
                    break;
                case GhnRequiredNote.KHONG_CHO_XEM_HANG:
                default:
                    deliveryRequiredNote = DeliveryRequiredNote.KHONGCHOXEMHANG;
                    break;
            }

            const createGhnDto: CreateGhnOrderDto = {
                from_name: data.sender.name,
                from_phone: data.sender.phone,
                from_address: data.sender.address,
                from_ward_name: data.sender.old_ward_name,
                from_ward_code: data.sender.old_ward_code,
                from_district_name: data.sender.old_district_name,
                from_district_id: data.sender.old_district_id,
                from_province_name: data.sender.old_province_name,
                to_name: data.receiver.name,
                to_phone: data.receiver.phone,
                to_address: data.receiver.address,
                to_ward_name: data.receiver.old_ward_name || '',
                to_ward_code: data.receiver.old_ward_code,
                to_district_name: data.receiver.old_district_name || '',
                to_district_id: data.receiver.old_district_id,
                to_province_name: data.receiver.old_province_name || '',
                client_order_code: data.client_order_code,
                content: 'San pham nong san',
                weight: Math.round(data.total_weight),
                length: 0,
                width: 0,
                height: 0,
                insurance_value: Math.round(data.total_value),
                note: data.order.delivery_note,
                cod_amount: codAmount,
                payment_type_id: paymentTypeId,
                required_note: required_note,
                items: data.products.map(p => ({
                    name: p.name,
                    code: p.code,
                    quantity: p.quantity,
                    price: Math.round(p.price),
                    weight: Math.round(p.weight)
                }))
            };

            this.logger.log(`Creating GHN order: ${JSON.stringify(createGhnDto)}`);
            const ghnResult = await this.GHNService.createOrderByGHN(createGhnDto);

            const deliveryData: Partial<Delivery> = {
                order_id: orderId,
                status: DeliveryStatus.PREPARING,
                real_shipping_fee: ghnResult.total_fee || data.shipping_fee,
                cod_amount: codAmount,
                total_fee: ghnResult.total_fee || data.shipping_fee,
                tracking_number: ghnResult.order_code,
                ghn_order_code: ghnResult.order_code,
                content: createGhnDto.content,
                note: createGhnDto.note,
                required_note: deliveryRequiredNote,
                delivery_method: shipping_carrier,
                payment_type_id: isCOD ? DeliveryPaymentType.NGUOINHAN : DeliveryPaymentType.NGUOIGUI
            };

            if (ghnResult.expected_delivery_time) {
                deliveryData.ship_date = new Date(ghnResult.expected_delivery_time);
                deliveryData.expected_delivery_time = new Date(ghnResult.expected_delivery_time);
            }

            const delivery = queryRunner.manager.create(Delivery, deliveryData);

            await queryRunner.manager.save(delivery);

            await queryRunner.manager.update(Order, { id: orderId }, {
                status: OrderStatus.CONFIRMED
            });

            await queryRunner.commitTransaction();
            this.logger.log(`Successfully created GHN order ${ghnResult.order_code} for order ${orderId}`);

            const updatedOrder = await this.orderRepository.findOne({
                where: { id: orderId },
                relations: [
                    'order_details',
                    'order_details.product',
                    'payment',
                    'delivery',
                    'delivery_address',
                    'farm'
                ]
            });

            return plainToInstance(OrderDto, updatedOrder, { excludeExtraneousValues: true });

        } catch (error) {
            this.logger.error(`Error confirming order delivery: ${error.message}`, error.stack);
            if (queryRunner.isTransactionActive) {
                await queryRunner.rollbackTransaction();
            }
            
            if (error instanceof BadRequestException ||
                error instanceof NotFoundException ||
                error instanceof ForbiddenException ||
                error instanceof InternalServerErrorException) {
                throw error;
            }
            
            throw new InternalServerErrorException({
                message: `Failed to confirm order delivery: ${error.message}`,
                code: ResponseCode.FAILED_TO_CONFIRM_ORDER_DELIVERY
            });
        } finally {
            await queryRunner.release();
        }
    }

    async handleGhnWebhook(webhookData: GhnWebhookDto): Promise<{ message: string }> {
        this.logger.log(`Received GHN webhook: Type=${webhookData.Type}, OrderCode=${webhookData.OrderCode}, Status=${webhookData.Status}`);

        // Tìm delivery theo ghn_order_code
        const delivery = await this.deliveryRepository.findOne({
            where: { ghn_order_code: webhookData.OrderCode },
            relations: ['order']
        });

        if (!delivery) {
            this.logger.warn(`Delivery not found for GHN order code: ${webhookData.OrderCode}`);
            throw new NotFoundException({
                message: 'Delivery not found',
                code: ResponseCode.NOT_FOUND,
            });
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Xử lý theo Type của webhook
            switch (webhookData.Type) {
                case GhnWebhookType.CREATE:
                    await this.handleCreateWebhook(queryRunner, delivery, webhookData);
                    break;
                
                case GhnWebhookType.SWITCH_STATUS:
                    await this.handleSwitchStatusWebhook(queryRunner, delivery, webhookData);
                    break;
                
                case GhnWebhookType.UPDATE_WEIGHT:
                    await this.handleUpdateWeightWebhook(queryRunner, delivery, webhookData);
                    break;
                
                case GhnWebhookType.UPDATE_COD:
                    await this.handleUpdateCodWebhook(queryRunner, delivery, webhookData);
                    break;
                
                case GhnWebhookType.UPDATE_FEE:
                    await this.handleUpdateFeeWebhook(queryRunner, delivery, webhookData);
                    break;
                
                default:
                    this.logger.warn(`Unknown webhook type: ${webhookData.Type}`);
            }

            await queryRunner.commitTransaction();
            this.logger.log(`Successfully processed GHN webhook for order code: ${webhookData.OrderCode}`);

            return { message: 'Webhook processed successfully' };

        } catch (error) {
            this.logger.error(`Error processing GHN webhook: ${error.message}`, error.stack);
            if (queryRunner.isTransactionActive) {
                await queryRunner.rollbackTransaction();
            }
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    private async handleCreateWebhook(queryRunner: any, delivery: Delivery, webhookData: GhnWebhookDto): Promise<void> {
        this.logger.log(`Processing CREATE webhook for order: ${webhookData.OrderCode}`);
        
        const updateData: any = {
            tracking_number: webhookData.OrderCode,
            total_fee: webhookData.TotalFee,
            cod_amount: webhookData.CODAmount,
        };

        if (webhookData.Status) {
            updateData.status = this.mapGhnStatusToDeliveryStatus(webhookData.Status);
        }

        await queryRunner.manager.update(Delivery, { id: delivery.id }, updateData);
    }

    private async handleSwitchStatusWebhook(queryRunner: any, delivery: Delivery, webhookData: GhnWebhookDto): Promise<void> {
        if (!webhookData.Status) {
            this.logger.warn(`No status provided in webhook data`);
            return;
        }

        const deliveryStatus = this.mapGhnStatusToDeliveryStatus(webhookData.Status);
        
        await queryRunner.manager.update(Delivery, { id: delivery.id }, {
            status: deliveryStatus,
        });

        // Cập nhật trạng thái order dựa trên trạng thái delivery
        let orderStatus: OrderStatus | null = null;
        
        switch (webhookData.Status) {
            case GhnOrderStatus.DELIVERED:
                orderStatus = OrderStatus.DELIVERED;
                break;
            case GhnOrderStatus.CANCEL:
            case GhnOrderStatus.LOST:
            case GhnOrderStatus.DAMAGE:
                orderStatus = OrderStatus.CANCELLED;
                break;
            case GhnOrderStatus.RETURNED:
                orderStatus = OrderStatus.CANCELLED; // Use CANCELLED as RETURNED doesn't exist
                break;
            case GhnOrderStatus.DELIVERING:
            case GhnOrderStatus.PICKED:
            case GhnOrderStatus.STORING:
            case GhnOrderStatus.TRANSPORTING:
                orderStatus = OrderStatus.SHIPPING;
                break;
        }

        if (orderStatus && delivery.order) {
            await queryRunner.manager.update(Order, { id: delivery.order_id }, {
                status: orderStatus,
            });
        }
    }

    private async handleUpdateWeightWebhook(queryRunner: any, delivery: Delivery, webhookData: GhnWebhookDto): Promise<void> {
        this.logger.log(`UPDATE_WEIGHT ................: ${webhookData.OrderCode}`);
        //TODO: Cập nhật trọng lượng nếu cần
    }

    private async handleUpdateCodWebhook(queryRunner: any, delivery: Delivery, webhookData: GhnWebhookDto): Promise<void> {
        await queryRunner.manager.update(Delivery, { id: delivery.id }, {
            cod_amount: webhookData.CODAmount,
        });
    }

    private async handleUpdateFeeWebhook(queryRunner: any, delivery: Delivery, webhookData: GhnWebhookDto): Promise<void> {
        const updateData: any = {
            total_fee: webhookData.TotalFee,
        };
        if (webhookData.Fee?.MainService) {
            updateData.real_shipping_fee = webhookData.Fee.MainService;
        }

        await queryRunner.manager.update(Delivery, { id: delivery.id }, updateData);
    }

    private mapGhnStatusToDeliveryStatus(ghnStatus: GhnOrderStatus): DeliveryStatus {
        const statusMap: Record<GhnOrderStatus, DeliveryStatus> = {
            [GhnOrderStatus.READY_TO_PICK]: DeliveryStatus.PREPARING,
            [GhnOrderStatus.PICKING]: DeliveryStatus.SHIPPED,
            [GhnOrderStatus.CANCEL]: DeliveryStatus.CANCELED,
            [GhnOrderStatus.MONEY_COLLECT_PICKING]: DeliveryStatus.SHIPPED,
            [GhnOrderStatus.PICKED]: DeliveryStatus.SHIPPED,
            [GhnOrderStatus.STORING]: DeliveryStatus.SHIPPED,
            [GhnOrderStatus.TRANSPORTING]: DeliveryStatus.SHIPPED,
            [GhnOrderStatus.SORTING]: DeliveryStatus.SHIPPED,
            [GhnOrderStatus.DELIVERING]: DeliveryStatus.SHIPPED,
            [GhnOrderStatus.MONEY_COLLECT_DELIVERING]: DeliveryStatus.SHIPPED,
            [GhnOrderStatus.DELIVERED]: DeliveryStatus.DELIVERED,
            [GhnOrderStatus.DELIVERY_FAIL]: DeliveryStatus.FAILED,
            [GhnOrderStatus.WAITING_TO_RETURN]: DeliveryStatus.RETURNED,
            [GhnOrderStatus.RETURN]: DeliveryStatus.RETURNED,
            [GhnOrderStatus.RETURN_TRANSPORTING]: DeliveryStatus.RETURNED,
            [GhnOrderStatus.RETURN_SORTING]: DeliveryStatus.RETURNED,
            [GhnOrderStatus.RETURNING]: DeliveryStatus.RETURNED,
            [GhnOrderStatus.RETURN_FAIL]: DeliveryStatus.FAILED,
            [GhnOrderStatus.RETURNED]: DeliveryStatus.RETURNED,
            [GhnOrderStatus.EXCEPTION]: DeliveryStatus.FAILED,
            [GhnOrderStatus.DAMAGE]: DeliveryStatus.CANCELED,
            [GhnOrderStatus.LOST]: DeliveryStatus.CANCELED,
        };

        return statusMap[ghnStatus] || DeliveryStatus.PREPARING;
    }

    async updateDeliveryFromGHN(deliveryId: number): Promise<Delivery> {
        const delivery = await this.deliveryRepository.findOne({
            where: { id: deliveryId },
            relations: ['order']
        });

        if (!delivery) {
            throw new NotFoundException({
                message: 'Delivery not found',
                code: ResponseCode.NOT_FOUND
            });
        }

        if (!delivery.ghn_order_code) {
            throw new BadRequestException({
                message: 'Delivery does not have a GHN order code',
                code: ResponseCode.INVALID_GHN_REQUEST
            });
        }

        try {
            const ghnOrderDetail = await this.GHNService.getOrderDetailByGHN(delivery.ghn_order_code);
            
            const updates: Partial<Delivery> = {};
            let hasChanges = false;

            if (ghnOrderDetail.status) {
                const mappedStatus = this.mapGhnStatusToDeliveryStatus(ghnOrderDetail.status as GhnOrderStatus);
                if (mappedStatus !== delivery.status) {
                    updates.status = mappedStatus;
                    hasChanges = true;
                    this.logger.log(`Updating delivery ${deliveryId} status from ${delivery.status} to ${mappedStatus} (GHN status: ${ghnOrderDetail.status})`);
                }
            }

            if (ghnOrderDetail.cod_amount !== undefined && ghnOrderDetail.cod_amount !== delivery.cod_amount) {
                updates.cod_amount = ghnOrderDetail.cod_amount;
                hasChanges = true;
            }

            if (ghnOrderDetail.leadtime && (!delivery.ship_date || new Date(ghnOrderDetail.leadtime).getTime() !== delivery.ship_date.getTime())) {
                updates.ship_date = new Date(ghnOrderDetail.leadtime);
                updates.expected_delivery_time = new Date(ghnOrderDetail.leadtime);
                hasChanges = true;
            }

            if (ghnOrderDetail.note && ghnOrderDetail.note !== delivery.note) {
                updates.note = ghnOrderDetail.note;
                hasChanges = true;
            }

            if (hasChanges) {
                await this.deliveryRepository.update(deliveryId, updates);
                if (updates.status && delivery.order_id) {
                    let orderStatus: OrderStatus | null = null;
                    
                    switch (updates.status) {
                        case DeliveryStatus.DELIVERED:
                            orderStatus = OrderStatus.DELIVERED;
                            break;
                        case DeliveryStatus.CANCELED:
                        case DeliveryStatus.FAILED:
                            orderStatus = OrderStatus.CANCELLED;
                            break;
                        case DeliveryStatus.SHIPPED:
                            orderStatus = OrderStatus.SHIPPING;
                            break;
                    }

                    if (orderStatus) {
                        await this.orderRepository.update(delivery.order_id, { status: orderStatus });
                    }
                }
                const updatedDelivery = await this.deliveryRepository.findOne({
                    where: { id: deliveryId },
                    relations: ['order']
                });
                return updatedDelivery!;
            } else {
                this.logger.log(`No changes detected for delivery ${deliveryId}`);
                return delivery;
            }

        } catch (error) {
            this.logger.error(`Failed to update delivery from GHN: ${error.message}`, error.stack);
            
            if (error instanceof BadRequestException ||
                error instanceof NotFoundException ||
                error instanceof InternalServerErrorException) {
                throw error;
            }
            
            throw new InternalServerErrorException({
                message: `Failed to update delivery from GHN: ${error.message}`,
                code: ResponseCode.FAILED_TO_UPDATE_DELIVERY
            });
        }
    }


}
