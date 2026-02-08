import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ImageAnalysisResult } from '../interfaces/image-analysis.interface';

@Entity()
export class ImageVerificationResult {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    log_id: number;

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
