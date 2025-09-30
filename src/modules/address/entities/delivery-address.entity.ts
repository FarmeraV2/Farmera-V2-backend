import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Province } from 'src/modules/address/entities/province.entity';
import { Ward } from 'src/modules/address/entities/ward.entity';
import { AddressType } from '../enums/address-type.enums';
import { User } from 'src/modules/user/entities/user.entity';
import { Farm } from 'src/modules/farm/entities/farm.entity';
import { Exclude } from 'class-transformer';
import { OldProvince } from './old-province.entity';
import { OldWard } from './old-ward.entity';
import { OldDistrict } from './old-district.entity';

@Entity()
export class DeliveryAddress {
    @PrimaryGeneratedColumn()
    address_id: number;

    @Column()
    name: string;

    @Column()
    phone: string;

    @ManyToOne(() => Province, { nullable: true })
    @JoinColumn({ name: 'province_code' })
    province?: Province;

    @Column({ nullable: true })
    province_code?: number;

    @ManyToOne(() => Ward, { nullable: true })
    @JoinColumn({ name: 'ward_code' })
    ward?: Ward;

    @Column({ nullable: true })
    ward_code?: number;

    @ManyToOne(() => OldProvince)
    @JoinColumn({ name: 'old_province_code' })
    old_province: OldProvince;

    @Column()
    old_province_code: number;

    @ManyToOne(() => OldDistrict)
    @JoinColumn({ name: 'old_district_code' })
    old_district: OldDistrict;

    @Column()
    old_district_code: number;

    @ManyToOne(() => OldWard)
    @JoinColumn({ name: 'old_ward_code' })
    old_ward: OldWard;

    @Column()
    old_ward_code: number;

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
