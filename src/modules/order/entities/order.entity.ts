import { Farm } from 'src/modules/farm/entities/farm.entity';
import { User } from 'src/modules/user/entities/user.entity';
import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { OrderStatus } from '../enums/order-status.enum';

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
    @JoinColumn({ name: 'farm' })
    farm: Farm;

    @Column({ nullable: true })
    store_id: number;

    @ManyToOne(() => Order, { nullable: true })
    @JoinColumn({ name: 'parent_order' })
    parent_order: Order;

    @Column({ nullable: true })
    parent_order_id: number;

    @Column()
    total_amount: number; // Đơn hàng con Tổng tiền hàng con đã bao gồm phí vận chuyển

    @Column()
    sub_total_amount: number; // Tổng tiền hàng chưa bao gồm phí vận chuyển. đơn hàng cha = tổng của các đơn hàng con. Đơn hàng con = tổng tiền hàng chưa bao gồm phí vận chuyển.

    @Column()
    grand_total: number; // đơn hàng cha: Tổng tiền hàng đã bao gồm phí vận chuyển ( đơn hàng cha = tổng của các đơn hàng con ) đơn hàng con null.

    @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING_CONFIRMATION })
    status: OrderStatus;

    @CreateDateColumn({ type: 'timestamptz' })
    created: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated: Date;

}
