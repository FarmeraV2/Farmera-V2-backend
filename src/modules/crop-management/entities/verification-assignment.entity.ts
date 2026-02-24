import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AuditorProfile } from './auditor-profile.entity';
import { Log } from './log.entity';

@Entity('verification_assignment')
export class VerificationAssignment {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    auditor_profile_id: number;

    @ManyToOne(() => AuditorProfile, (a) => a.assignments)
    @JoinColumn({ name: 'auditor_profile_id' })
    auditor_profile: AuditorProfile;

    @Column()
    log_id: number;

    @ManyToOne(() => Log)
    @JoinColumn({ name: 'log_id' })
    log: Log;

    @Column({ type: 'varchar', length: 66, nullable: true })
    vote_transaction_hash: string | null;

    @CreateDateColumn({ type: 'timestamptz' })
    assigned_at: Date;

    @Column({ type: 'timestamptz', nullable: true })
    voted_at: Date | null;

    @Column({ type: 'timestamptz' })
    deadline: Date;
}
