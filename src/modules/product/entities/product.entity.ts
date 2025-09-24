import { Farm } from 'src/modules/farm/entities/farm.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, ManyToMany, JoinTable } from 'typeorm';
import { ProductStatus } from '../enums/product-status.enum';
import { Subcategory } from './sub-category.entity';

@Entity()
export class Product {
    @PrimaryGeneratedColumn()
    product_id: number;

    @Column()
    product_name: string;

    @Column()
    description: string;

    @Column({ type: 'numeric', precision: 10, scale: 2 })
    price_per_unit: number;

    @Column()
    unit: string;

    @Column({ type: "double precision" })
    weight_per_unit: number; // in grams

    @Column()
    stock_quantity: number;

    @Column({ default: 0 })
    total_sold: number;

    @Column({ type: 'float', default: 0 })
    average_rating: number;

    @Column({ nullable: true })
    thumbnail: string;

    @Column('text', { array: true, nullable: true })
    image_urls: string[] | null;

    @Column('text', { array: true, nullable: true })
    video_urls: string[] | null;

    @Column({ type: 'enum', enum: ProductStatus, default: ProductStatus.NOT_YET_OPEN })
    status: ProductStatus;

    @CreateDateColumn({ type: 'timestamptz' })
    created: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated: Date;

    @Column({ nullable: true })
    qr_code?: string;

    @ManyToOne(() => Farm)
    @JoinColumn({ name: 'farm_id' })
    farm: Farm;

    @Column()
    farm_id: number;

    @ManyToMany(() => Subcategory, (sub) => sub.products, { cascade: true })
    @JoinTable()
    subcategories?: Subcategory[];

    // @OneToMany(() => Process, (process) => process.product)
    // @JoinColumn({ name: 'process_id' })
    // processes?: Process[];
}