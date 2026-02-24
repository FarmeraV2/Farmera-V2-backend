import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { SeasonDetail } from './season-detail.entity';
import { Farm } from 'src/modules/farm/entities/farm.entity';
import { OnChainLogStatus } from '../enums/onchain-log-status.enum';

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

    @Column({ nullable: true })
    transaction_hash?: string;

    @Column({ nullable: true })
    notes?: string;

    @CreateDateColumn({ type: "timestamptz" })
    created: Date;

    @ManyToOne(() => SeasonDetail, (detail) => detail.logs)
    @JoinColumn({ name: "season_detail_id" })
    season_detail: SeasonDetail

    @Column()
    season_detail_id: number;

    @ManyToOne(() => Farm)
    @JoinColumn({ name: "farm_id" })
    farm: Farm

    @Column()
    farm_id: number;

    @Column({ default: true })
    is_active: boolean;

    @Column({ default: OnChainLogStatus.None })
    status: OnChainLogStatus;

    //
    verified: boolean = false;
}