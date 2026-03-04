import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from 'src/modules/user/entities/user.entity';
import { VerificationAssignment } from './verification-assignment.entity';

@Entity('auditor_profiles')
export class AuditorProfile {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    user_id: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'varchar', length: 42, unique: true })
    wallet_address: string;

    @Column({ default: true })
    is_active: boolean;

    @Column({ type: 'int', default: 0 })
    total_verifications: number;

    @Column({ type: 'int', default: 0 })
    correct_verifications: number;

    @OneToMany(() => VerificationAssignment, (a) => a.auditor_profile)
    assignments: VerificationAssignment[];

    @CreateDateColumn({ type: 'timestamptz' })
    created: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated: Date;
}
