import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Province } from './province.entity';

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
    @JoinColumn({ name: 'province_code' })
    province: Province;
}
