import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { Ward } from './ward.entity';

@Entity()
export class Province {
    @PrimaryColumn()
    code: number;

    @Column()
    name: string;

    @Column()
    division_type: string;

    @Column()
    codename: string;

    @Column()
    phone_code: number;

    @OneToMany(() => Ward, (ward) => ward.province)
    wards: Ward;
}
