import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('score_history')
export class ScoreHistory {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 20 })
    entity_type: string;

    @Column()
    entity_id: number;

    @Column({ type: 'float' })
    score: number;

    @Column({ type: 'float', nullable: true })
    previous_score: number | null;

    @Column({ type: 'boolean', default: false })
    is_provisional: boolean;

    @Column({ type: 'int', default: 0 })
    pending_verifications: number;

    @CreateDateColumn({ type: 'timestamptz' })
    recorded_at: Date;
}
