import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Farm } from './farm.entity';
import { IdentificationStatus } from '../enums/identification.enums';
import { Gender } from 'src/modules/user/enums/gender.enum';

@Entity('identifications')
export class Identification {
    @PrimaryGeneratedColumn()
    id: string;

    @Column()
    full_name: string;

    @Column()
    hashed_id_number: string;

    @Column({ type: 'date' })
    dob: Date;

    @Column()
    gender: string;

    @Column()
    nationality: string;

    @Column()
    address: string;

    @Column({ type: 'jsonb', nullable: true })
    address_entity?: Record<string, any>;

    @Column({ type: 'date' })
    doe: Date;

    @Column()
    id_card_image_url?: string;

    @Column({ type: 'real' })
    face_match_score: number;

    @Column({ type: 'real' })
    liveness_score: number;

    @Column({ type: 'enum', enum: IdentificationStatus, enumName: 'identifications_status', default: IdentificationStatus.PENDING })
    status: IdentificationStatus;

    @CreateDateColumn()
    created: Date;

    @OneToOne(() => Farm, (farm) => farm.identification)
    @JoinColumn({ name: 'farm_id' })
    farm: Farm;
}
