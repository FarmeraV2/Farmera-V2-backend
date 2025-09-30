import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { SeasonDetail } from './season-detail.entity';

@Entity()
export class Log {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    description: string;

    @Column('text', { array: true })
    image_urls: string[];

    @Column('text', { array: true })
    video_urls: string[];

    @Column({ type: "jsonb" })
    location: { lat: number, lng: number }

    @Column()
    transaction_hash: string;

    @Column({ nullable: true })
    notes?: string;

    @CreateDateColumn({ type: "timestamptz" })
    created: Date;

    @ManyToOne(() => SeasonDetail, (detail) => detail.logs)
    season_detail: SeasonDetail
}