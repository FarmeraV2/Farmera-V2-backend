import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Province } from './province.entity';
import { DeliveryAddress } from './delivery-address.entity';

@Entity()
export class Ward {
    @PrimaryColumn()
    code: number;

    @Column()
    name: string;

    @Column()
    type: string;

    @Column()
    full_name: string;

    @Column()
    name_en: string;

    @Column()
    full_name_en: string;

    @Column()
    type_en: string;

    @ManyToOne(() => Province, (province) => province.ward)
    @JoinColumn({ name: "province_code" })
    province: Province;
}
