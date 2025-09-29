import { Farm } from 'src/modules/farm/entities/farm.entity';
import { User } from 'src/modules/user/entities/user.entity';
import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

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
    total_amount: number;

    @Column()
    Status: string;

    @CreateDateColumn({ type: 'timestamptz' })
    created: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated: Date;

}
