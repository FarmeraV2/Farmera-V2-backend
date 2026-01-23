import { Farm } from 'src/modules/farm/entities/farm.entity';
import { User } from 'src/modules/user/entities/user.entity';
import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, OneToMany } from 'typeorm';
import { OrderStatus } from '../enums/order-status.enum';
import { Payment } from './payment.entity';
import { Delivery } from './delivery.entity';
import { OrderDetail } from './order_detail.entity';
import { DeliveryAddress } from 'src/modules/address/entities/delivery-address.entity';

@Entity()
export class Order {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user' })
    user: User;

    @Column()
    cus_id: number;

    @ManyToOne(() => Farm, { nullable: true })
    @JoinColumn({ name: 'store_id' })
    farm: Farm;
    

    @Column({ nullable: true })
    store_id: number;
    
    @Column()
    shipping_fee: number;
    
    @Column()
    total_amount: number; // Tổng tiền của đơn hàng

    @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING_CONFIRMATION })
    status: OrderStatus;

    @CreateDateColumn({ type: 'timestamptz' })
    created: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated: Date;
    
    @ManyToOne(() => Payment)
    @JoinColumn({ name: 'payment_id' })
    payment: Payment;

    @Column({ nullable: true })
    payment_id: number;
    
    @ManyToOne(() => DeliveryAddress, (delivery_address) => delivery_address.orders)
    @JoinColumn({ name: 'delivery_address_id' })
    delivery_address: DeliveryAddress;

    @Column({ nullable: true })
    delivery_address_id: number;
    
    @OneToOne(() => Delivery, (delivery) => delivery.order, { nullable: true })
    delivery?: Delivery;
    
    @OneToMany(() => OrderDetail, (orderDetail) => orderDetail.order, { cascade: true })
    order_details: OrderDetail[];
    
    @Column({ type: 'text', nullable: true })
    delivery_note?: string;

}
