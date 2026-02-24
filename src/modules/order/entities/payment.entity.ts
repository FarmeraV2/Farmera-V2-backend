import { Entity, JoinColumn, PrimaryGeneratedColumn, Column, OneToOne, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Order } from './order.entity';
import { PaymentMethod, PaymentStatus } from '../enums/payment.enum';

@Entity()
export class Payment {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({type : 'enum', enum: PaymentStatus, default: PaymentStatus.UNPAID})
    status: PaymentStatus;

    @Column({type : 'enum', enum: PaymentMethod, default: PaymentMethod.COD})
    method: PaymentMethod;

    @Column()
    total_amount: number;

    @Column({ type: 'text', nullable: true })
    qr_code: string | null; // ảnh qr code thanh toán lưu dưới dạng base64

    @Column({ type: 'text', nullable: true })
    checkout_url: string | null; // link ảnh thanh toán

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
