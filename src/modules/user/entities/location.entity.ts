import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { LocationType } from '../enums/location-type.enums';

@Entity()
export class Location {
    @PrimaryGeneratedColumn()
    location_id: number;

    @Column()
    name: string;

    @Column()
    phone: string

    @Column()
    city: string;

    @Column({ nullable: true })
    province: string;

    @Column()
    district: string;

    @Column({ nullable: true })
    ward: string;

    @Column()
    street: string;

    @Column({ nullable: true })
    address_line: string;

    @Column({ nullable: true, enum: LocationType })
    type: LocationType;

    @Column({ default: false })
    is_primary: boolean;

    @Column({ nullable: true })
    latitude: number;

    @Column({ nullable: true })
    longitude: number;

    @Column({ nullable: true })
    postal_code: string;

    @Column({ nullable: true })
    state: string;

    @ManyToOne(() => User, (user) => user.locations)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date;
}