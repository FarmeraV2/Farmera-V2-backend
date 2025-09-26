import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Province } from 'src/modules/address/entities/province.entity';
import { Ward } from 'src/modules/address/entities/ward.entity';
import { AddressType } from '../enums/address-type.enums';
import { User } from 'src/modules/user/entities/user.entity';
import { Farm } from 'src/modules/farm/entities/farm.entity';
import { Exclude } from 'class-transformer';

@Entity()
export class DeliveryAddress {
    @PrimaryGeneratedColumn()
    address_id: number;

    @Column()
    name: string;

    @Column()
    phone: string

    @ManyToOne(() => Province)
    @JoinColumn({ name: "province_code" })
    province: Province;

    @Column()
    province_code: number;

    @ManyToOne(() => Ward)
    @JoinColumn({ name: "ward_code" })
    ward: Ward;

    @Column()
    ward_code: number;

    @Column()
    street: string;

    @Column({ nullable: true })
    postal_code: string;

    @Column({ nullable: true })
    type: string; // e.g home, work, ...

    @Column({ default: false })
    is_primary: boolean;

    @Column('jsonb', { nullable: true })
    location?: { lat: number; lng: number };

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date;

    @Column({ enum: AddressType, default: AddressType.CUSTOMER })
    @Exclude()
    owner_type: AddressType;

    @ManyToOne(() => User, (user) => user.addresses, { nullable: true })
    @JoinColumn({ name: 'user_id' })
    user?: User;

    @OneToOne(() => Farm, (farm) => farm.address, { nullable: true })
    farm?: Farm;
}