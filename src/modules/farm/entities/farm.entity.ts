import { Entity, Column, CreateDateColumn, OneToOne, UpdateDateColumn, OneToMany, JoinColumn, BeforeInsert, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { FarmStatus } from "../enums/farm-status.enum";
import { Identification } from "./identification.entity";
import { User } from "src/modules/user/entities/user.entity";

@Entity()
export class Farm {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('uuid')
    farm_id: string;

    @Column()
    farm_name: string;

    @Column()
    description: string;

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
    @JoinColumn()
    owner: User;

    @CreateDateColumn({ type: "timestamptz" })
    created: Date;

    @UpdateDateColumn({ type: "timestamptz" })
    updated: Date;

    // stats?: FarmStats

    // @OneToOne(() => Address, (address) => address.farm, { cascade: true })
    // @JoinColumn({ name: 'address_id' })
    // address: Address;


    // @OneToMany(() => Product, (product) => product.farm, { cascade: true })
    // products: Product[];
}