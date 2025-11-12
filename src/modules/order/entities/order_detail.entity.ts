import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Order } from './order.entity';
import { Product } from 'src/modules/product/entities/product.entity';

@Entity()
export class OrderDetail {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Order)
    @JoinColumn({ name: 'order_id' })
    order: Order;

    @Column()
    order_id: number;

    @ManyToOne(() => Product)
    @JoinColumn({ name: 'product_id' })
    product: Product;
    
    @Column()
    product_id: number;

    @Column()
    ordered_quantity: number;

    @Column()
    weight: number;

    @Column()
    unit: string;

    @Column('decimal', { precision: 10, scale: 2 }) // Thay vì 'int'
    unit_price: number;
    
    @Column('decimal', { precision: 10, scale: 2 })
    total_price: number;
    @Column()
    status: string;

}
