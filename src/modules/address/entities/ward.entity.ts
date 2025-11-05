import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Province } from './province.entity';

@Entity()
export class Ward {
    @PrimaryColumn()
    code: number;

    @Column()
    name: string;

    @Column()
    codename: string;

    @Column()
    division_type: string;

    @ManyToOne(() => Province, (province) => province.wards, { nullable: true })
    @JoinColumn({ name: 'province_code' })
    province?: Province;

    @Column({ nullable: true })
    province_code?: number;
}
