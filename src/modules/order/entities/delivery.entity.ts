import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Column, OneToOne, UpdateDateColumn, CreateDateColumn } from 'typeorm';
import { Order } from './order.entity';

@Entity()
export class Delivery {
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
    amount: number;

    @CreateDateColumn({ type: 'timestamptz' })
    created: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated: Date;

    //TODO:
    // Relation to user delivery address

}
