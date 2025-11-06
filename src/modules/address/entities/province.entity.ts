import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { Ward } from './ward.entity';

@Entity()
export class Province {
    @PrimaryColumn()
    code: number;

    @Column()
    name: string;

    @Column({default: ''})
    division_type: string;

    @Column({default: ''})
    codename: string;

    @Column({nullable: true})
    phone_code: number;

    @OneToMany(() => Ward, (ward) => ward.province, { cascade: true })
    wards: Ward[];
}
