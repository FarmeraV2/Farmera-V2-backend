import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ImageAnalysisResult } from '../../crop-management/interfaces/image-analysis.interface';
import { Log } from 'src/modules/crop-management/entities/log.entity';
import { Farm } from 'src/modules/farm/entities/farm.entity';

@Entity()
export class LogImageVerificationResult {
    @PrimaryGeneratedColumn()
    id: number;

    @OneToOne(() => Log)
    @JoinColumn({ name: "log_id" })
    log: Log;

    @Column()
    log_id: number;

    @ManyToOne(() => Farm)
    @JoinColumn({ name: "farm_id" })
    farm: Farm;

    @Column()
    farm_id: number;

    @Column({ type: 'decimal', precision: 5, scale: 4, default: 0 })
    overall_score: number;

    @Column({ default: false })
    is_duplicate: boolean;

    @Column({ nullable: true })
    duplicate_source_log_id?: number;

    @Column({ type: 'jsonb', nullable: true })
    ai_analysis?: ImageAnalysisResult;

    @Column({ type: 'decimal', precision: 5, scale: 4, default: 0 })
    manipulation_score: number;

    @Column({ type: 'decimal', precision: 5, scale: 4, default: 0 })
    relevance_score: number;

    @Column({ default: false })
    processed: boolean;

    @CreateDateColumn({ type: 'timestamptz' })
    created: Date;
}
