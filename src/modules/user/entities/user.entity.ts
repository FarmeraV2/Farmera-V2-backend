import { Exclude } from 'class-transformer';
import { Column, Entity, OneToMany, CreateDateColumn, UpdateDateColumn, JoinColumn, PrimaryGeneratedColumn, BeforeInsert } from 'typeorm';
import { Gender } from '../enums/gender.enum';
import { UserRole } from '../enums/role.enum';
import { UserStatus } from '../enums/user-status.enum';
import { Location } from './location.entity';
import { PaymentMethod } from './payment-method.entity';
import { v4 as uuidv4 } from 'uuid';

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

    @OneToMany(() => Location, (location) => location.user, { cascade: true })
    @JoinColumn({ name: 'location_id' })
    locations: Location[];

    @OneToMany(() => PaymentMethod, (paymentMethod) => paymentMethod.user, { cascade: true })
    @JoinColumn({ name: 'payment_method_id' })
    payment_methods: PaymentMethod[];

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date;
}