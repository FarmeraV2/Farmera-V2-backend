import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { OldDistrict } from './old-district.entity';

@Entity()
export class OldProvince {
    @PrimaryColumn()
    code: number;

    @Column()
    name: string;

    @Column({nullable: true})
    phone_code: number;

    @Column({default: ''})
    division_type: string;

    @Column({default: ''})
    codename: string;

    @OneToMany(() => OldDistrict, (district) => district.province, { cascade: true })
    districts: OldDistrict[];
}
