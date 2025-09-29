import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Column, OneToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Order } from './order.entity';
import { Product } from 'src/modules/product/entities/product.entity';

@Entity()
export class OrderDetail {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Order)
    @JoinColumn({ name: 'order' })
    order: Order;

    @Column()
    order_id: number;

    @ManyToOne(() => Product)
    @JoinColumn({ name: 'product' })
    product: Product;

    @Column()
    product_id: number;

    @Column()
    quantity: number;

    @Column()
    weight: number;

    @Column()
    unit: string;

    @Column()
    price: number;

    @Column()
    status: string;

    @Column()
    total_price: number;

}
