import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Column, OneToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Order } from './order.entity';

@Entity()
export class Payment {
    @PrimaryGeneratedColumn()
    id: number;

    @OneToOne(() => Order, { nullable: true })
    @JoinColumn({ name: 'order' })
    order: Order;

    @Column({ nullable: true })
    order_id: number;

    @Column()
    status: string;

    @Column()
    total_amount: number;

    @Column()
    method: string;

    @Column({ nullable: true })
    qr_id: string;

    @Column({ nullable: true })
    qr_image: string;

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
