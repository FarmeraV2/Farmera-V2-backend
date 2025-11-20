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
    phone_code: number;

    @OneToMany(() => Ward, (ward) => ward.province, { cascade: true })
    wards: Ward[];

    @Column({ nullable: true })
    ghn_code?: number;
}
