import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { Ward } from "./ward.entity";
import { DeliveryAddress } from "./delivery-address.entity";

@Entity()
export class Province {
    @PrimaryColumn()
    code: number;

    @Column()
    name: string;

    @Column()
    full_name: string;

    @Column()
    name_en: string;

    @Column()
    full_name_en: string;

    @Column()
    type: string;

    @Column()
    type_en: string;

    @OneToMany(() => Ward, (ward) => ward.province)
    ward: Ward

    @OneToMany(() => DeliveryAddress, (address) => address.province)
    delivery_address: DeliveryAddress
}