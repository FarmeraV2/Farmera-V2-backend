import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Column, OneToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Order } from './order.entity';
import { PaymentMethod, PaymentStatus } from '../enums/payment-status';

@Entity()
export class Payment {
    @PrimaryGeneratedColumn()
    id: number;

    @OneToOne(() => Order, { nullable: true })
    @JoinColumn({ name: 'order' })
    order: Order;

    @Column({ nullable: true })
    order_id: number;

    @Column({type : 'enum', enum: PaymentStatus, default: PaymentStatus.UNPAID})
    status: PaymentStatus;

    @Column({type : 'enum', enum: PaymentMethod, default: PaymentMethod.COD})
    method: PaymentMethod;

    @Column()
    total_amount: number;

    @Column({ nullable: true })
    qr_code: string; // ảnh qr code thanh toán lưu dưới dạng base64

    @Column({ nullable: true })
    checkout_url: string; // link ảnh thanh toán

    @Column({ nullable: true })
    transaction_id: string;


    @Column()
    amount: number;

    @CreateDateColumn({ type: 'timestamptz' })
    created: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated: Date;

    @Column({ type: 'timestamptz', nullable: true })
    payment_time: Date;

    @Column()
    currency: string;


}
