import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CertificateType } from '../enums/certificate-type.enum';
import { Farm } from './farm.entity';
import { CertificateStatus } from '../enums/certificate-status.enum';

@Entity()
export class FarmCertificate {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "enum", enum: CertificateType, enumName: "certificate_type" })
    type: CertificateType

    @Column()
    url: string;

    @Column({ type: "jsonb", nullable: true })
    meta_data?: Record<string, any>;

    @Column({ type: "enum", enum: CertificateStatus, enumName: "certificate_status", default: CertificateStatus.PENDING })
    status: CertificateStatus;

    @Column({ default: false })
    is_deleted: boolean;

    @CreateDateColumn({ type: "timestamptz" })
    created: Date;

    @ManyToOne(() => Farm)
    @JoinColumn({ name: "farm_id" })
    farm: Farm;

    @Column()
    farm_id: number;
}