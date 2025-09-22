import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Province } from 'src/modules/address/entities/province.entity';
import { Ward } from 'src/modules/address/entities/ward.entity';
import { AddressType } from '../enums/address-type.enums';
import { User } from 'src/modules/user/entities/user.entity';

@Entity()
export class DeliveryAddress {
    @PrimaryGeneratedColumn()
    location_id: number;

    @Column()
    name: string;

    @Column()
    phone: string

    @ManyToOne(() => Province, (province) => province.delivery_address)
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
    address_line: string;

    @Column({ nullable: true })
    postal_code: string;

    @Column({ nullable: true })
    type: string; // e.g home, work, ...

    @Column({ enum: AddressType, default: AddressType.CUSTOMER })
    owner_type: AddressType;

    @Column({ default: false })
    is_primary: boolean;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date;

    @ManyToOne(() => User, (user) => user.address, { nullable: true })
    @JoinColumn({ name: 'user_id' })
    user?: User;

    // @OneToOne(() => )
}