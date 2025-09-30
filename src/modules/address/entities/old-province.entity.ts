import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { OldDistrict } from './old-district.entity';

@Entity()
export class OldProvince {
    @PrimaryColumn()
    code: number;

    @Column()
    name: string;

    @Column()
    phone_code: number;

    @Column()
    division_type: string;

    @Column()
    codename: string;

    @OneToMany(() => OldDistrict, (district) => district.province, { cascade: true })
    districts: OldDistrict;
}
