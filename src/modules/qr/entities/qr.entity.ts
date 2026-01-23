import { Product } from 'src/modules/product/entities/product.entity';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { QrStatus } from '../enums/qr-status';
import { User } from 'src/modules/user/entities/user.entity';
import { OrderDetail } from 'src/modules/order/entities/order_detail.entity';

@Entity()
export class Qr {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    qr_code: string;

    // @ManyToOne(() => Product)
    // @JoinColumn({ name: "product_id" })
    // product: Product;

    // @Column()
    // product_id: number;

    @OneToOne(() => OrderDetail)
    @JoinColumn({ name: "id" })
    oderDetail: OrderDetail;

    @Column()
    order_detail_id: number;

    @Column({ type: "enum", enum: QrStatus, enumName: "qr_status", default: QrStatus.CREATED })
    status: QrStatus;

    @CreateDateColumn({ type: "timestamptz" })
    created: Date;

    @UpdateDateColumn({ type: "timestamptz" })
    updated: Date;

    @Column({ type: "timestamptz", nullable: true })
    activated: Date;

    @Column({ default: 0 })
    scan_count: number;
}