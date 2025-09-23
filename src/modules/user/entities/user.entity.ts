import { Exclude } from 'class-transformer';
import { Column, Entity, OneToMany, CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn, BeforeInsert, OneToOne } from 'typeorm';
import { Gender } from '../enums/gender.enum';
import { UserRole } from '../enums/role.enum';
import { UserStatus } from '../enums/user-status.enum';
import { PaymentMethod } from './payment-method.entity';
import { v4 as uuidv4 } from 'uuid';
import { Farm } from 'src/modules/farm/entities/farm.entity';
import { DeliveryAddress } from 'src/modules/address/entities/delivery-address.entity';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    @Exclude()
    id: number;

    @Column({ type: 'uuid', unique: true })
    uuid: string;

    @BeforeInsert()
    generateId() {
        if (!this.uuid) {
            this.uuid = uuidv4();
        }
    }

    @Column({ unique: true })
    email: string;

    @Column({ unique: true, nullable: true })
    phone: string;

    @Column()
    first_name: string;

    @Column()
    last_name: string;

    @Exclude({ toPlainOnly: true })
    @Column()
    hashed_pwd: string;

    @Column({ enum: Gender, default: Gender.UNSPECIFIED })
    gender: Gender;

    @Column({ nullable: true })
    avatar?: string;

    @Column({ nullable: true })
    birthday?: Date;

    @Column({ enum: UserRole, default: UserRole.BUYER })
    role: UserRole;

    @Column({ default: 0 })
    points: number;

    @Column({ enum: UserStatus, default: UserStatus.ACTIVE })
    status: UserStatus;

    @OneToMany(() => DeliveryAddress, (address) => address.user, { cascade: true })
    addresses: DeliveryAddress[];

    @OneToMany(() => PaymentMethod, (paymentMethod) => paymentMethod.user, { cascade: true })
    payment_methods: PaymentMethod[];

    @OneToOne(() => Farm, (farm) => farm.owner, { nullable: true })
    farm?: Farm

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date;
}