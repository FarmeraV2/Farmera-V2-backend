import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { PaymentProvider } from '../enums/payment-provider.enum';

// todo!("fix this fk shit")

@Entity({ name: 'payment_methods' })
export class PaymentMethod {
    @PrimaryGeneratedColumn()
    payment_method_id: number;

    @Column({ type: 'enum', enum: PaymentProvider, nullable: true })
    provider: PaymentProvider;

    @Column({ nullable: false })
    external_id: string;

    @Column({ nullable: true })
    last_four: string;

    @Column({ nullable: true })
    card_type: string;

    @Column({ nullable: true })
    expiry_date: string;

    @Column({ nullable: true })
    cardholder_name: string;

    @Column({ nullable: true })
    billing_address: string;

    @Column({ nullable: true })
    token: string;

    @Column({ default: false })
    is_default: boolean;

    @ManyToOne(() => User, (user) => user.payment_methods)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ default: true })
    is_active: boolean;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date;
}
