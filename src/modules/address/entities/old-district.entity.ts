import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn } from 'typeorm';
import { OldProvince } from './old-province.entity';
import { OldWard } from './old-ward.entity';

@Entity()
export class OldDistrict {
    @PrimaryColumn()
    code: number;

    @Column()
    name: string;

    @Column()
    division_type: string

    @ManyToOne(() => OldProvince, (province) => province.districts)
    @JoinColumn({ name: "province_code" })
    province: OldProvince;

    @Column()
    province_code: number;

    @OneToMany(() => OldWard, (ward) => ward.district, { nullable: true, cascade: true })
    wards?: OldWard[]

    @Column({ nullable: true })
    ghn_code?: number;
}