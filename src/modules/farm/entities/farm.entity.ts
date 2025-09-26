import { Entity, Column, CreateDateColumn, OneToOne, UpdateDateColumn, OneToMany, JoinColumn, BeforeInsert, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { FarmStatus } from "../enums/farm-status.enum";
import { Identification } from "./identification.entity";
import { User } from "src/modules/user/entities/user.entity";
import { DeliveryAddress } from "src/modules/address/entities/delivery-address.entity";
import { v4 as uuidv4 } from 'uuid';

@Entity()
export class Farm {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('uuid')
    farm_id: string;
    @BeforeInsert()
    generateId() {
        if (!this.farm_id) this.farm_id = uuidv4();
    }

    @Column({ unique: true })
    farm_name: string;

    @Column({ nullable: true })
    description?: string;

    @Column({ nullable: true })
    avatar_url: string;

    @Column('text', { array: true, nullable: true })
    profile_image_urls: string[];

    @Column('text', { array: true, nullable: true })
    certificate_img_urls: string[];

    @Column()
    email: string;

    @Column()
    phone: string;

    @Column()
    tax_number: string;

    @Column({ type: 'enum', enum: FarmStatus, default: FarmStatus.PENDING })
    status: FarmStatus;

    @OneToOne(() => Identification, (identification) => identification.farm, { cascade: true })
    identification: Identification;

    @OneToOne(() => User, (user) => user.farm)
    @JoinColumn({ name: "user_id" })
    owner: User;

    @Column()
    user_id: number;

    @CreateDateColumn({ type: "timestamptz" })
    created: Date;

    @UpdateDateColumn({ type: "timestamptz" })
    updated: Date;

    // stats?: FarmStats

    @Column()
    address_id: number;

    @OneToOne(() => DeliveryAddress, (address) => address.farm)
    @JoinColumn({ name: 'address_id' })
    address: DeliveryAddress;

    // @OneToMany(() => Product, (product) => product.farm, { cascade: true })
    // products: Product[];
}