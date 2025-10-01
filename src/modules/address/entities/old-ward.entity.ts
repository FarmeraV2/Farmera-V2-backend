import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { OldDistrict } from './old-district.entity';

@Entity()
export class OldWard {
    @PrimaryColumn()
    code: number;

    @Column()
    name: string;

    @Column()
    codename: string;

    @Column()
    division_type: string;

    @ManyToOne(() => OldDistrict, (district) => district.wards, { nullable: true })
    @JoinColumn({ name: "district_code" })
    district?: OldDistrict;

    @Column({ nullable: true })
    district_code?: number;
}