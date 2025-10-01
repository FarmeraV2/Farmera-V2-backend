import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Column, OneToOne, UpdateDateColumn, CreateDateColumn } from 'typeorm';
import { Order } from './order.entity';
import { DeliveryPaymentType, DeliveryRequiredNote, DeliveryStatus } from '../enums/delivery-status';

@Entity()
export class Delivery {
    @PrimaryGeneratedColumn()
    id: number;

    @OneToOne(() => Order, { nullable: true })
    @JoinColumn({ name: 'order' })
    order: Order;

    @Column({ nullable: true })
    order_id: number;

    @Column({ type: 'enum', enum: DeliveryStatus, default: DeliveryStatus.PREPARING })
    status: DeliveryStatus;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    shipping_fee: number; // Cước phí vận chuyển cho 1 đơn hàng

    @Column({nullable: true})
    cod_amount: number; // Số tiền thu hộ (COD) cho đơn hàng

    @Column({nullable: true})
    total_fee: number; // Tổng phí (phí vận chuyển + phí thu hộ)

    @Column({nullable: true})
    tracking_number: string;

    @Column({nullable: true})
    content: string;  // Mô tả hàng hóa (giá trị default hoặc cửa hàng tự thêm)

    @Column({nullable: true})
    note: string; // Ghi chú (của khách hoặc của cửa hàng).

    @Column({ type: 'enum', enum: DeliveryRequiredNote, default: DeliveryRequiredNote.KHONGCHOXEMHANG })
    required_note: DeliveryRequiredNote; // Yêu cầu người nhận (cho thử hàng, cho xem hàng không thử, không cho xem hàng)

    @Column({nullable: true})
    delivery_instructions: string;
    
    @Column()
    delivery_method: string; // Hàng nhẹ/ hàng nặng

    @Column({ type: 'enum', enum: DeliveryPaymentType, default: DeliveryPaymentType.NGUOIGUI })
    payment_type_id: DeliveryPaymentType;

    @Column({ type: 'timestamptz', nullable: true })
    ship_date: Date;

    @CreateDateColumn({ type: 'timestamptz' })
    created: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated: Date;

    //TODO:
    // Relation to user delivery address

}
