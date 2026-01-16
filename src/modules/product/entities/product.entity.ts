import { Farm } from 'src/modules/farm/entities/farm.entity';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    ManyToMany,
    JoinTable,
    OneToMany,
    OneToOne,
} from 'typeorm';
import { ProductStatus } from '../enums/product-status.enum';
import { Subcategory } from './sub-category.entity';
import { Review } from 'src/modules/review/entities/review.entity';
import { Season } from 'src/modules/crop-management/entities/season.entity';

@Entity()
export class Product {
    @PrimaryGeneratedColumn()
    product_id: number;

    @Column()
    product_name: string;

    @Column()
    description: string;

    @Column({ type: 'bigint' })
    price_per_unit: number;

    @Column()
    unit: string;

    @Column({ type: 'double precision' })
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

    @Column({ type: 'enum', enum: ProductStatus, enumName: 'product_status', default: ProductStatus.NOT_YET_OPEN })
    status: ProductStatus;

    @CreateDateColumn({ type: 'timestamptz' })
    created: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated: Date;

    @Column({ nullable: true })
    qr_code?: string;

    @ManyToOne(() => Farm, (farm) => farm.products)
    @JoinColumn({ name: 'farm_id' })
    farm: Farm;

    @Column()
    farm_id: number;

    @ManyToMany(() => Subcategory, (sub) => sub.products, { cascade: true })
    @JoinTable()
    subcategories?: Subcategory[];

    @OneToMany(() => Review, (review) => review.product)
    reviews?: Review[];

    @OneToOne(() => Season, { nullable: true })
    @JoinColumn({ name: 'season_id' })
    season?: Season;

    @Column({ nullable: true })
    season_id?: number;

    //todo!("summary columns for review data")
}
