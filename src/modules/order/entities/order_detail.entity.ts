import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Column } from 'typeorm';
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
    ordered_quantity: number;

    @Column()
    weight: number;

    @Column()
    unit: string;

    @Column()
    unit_price: number;

    @Column()
    total_price: number;

    @Column()
    status: string;

}
