import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { SeasonStatus } from '../enums/season-status.enum';
import { Plot } from './plot.entity';
import { SeasonDetail } from './season-detail.entity';
import { Farm } from 'src/modules/farm/entities/farm.entity';
import { CropType } from '../enums/crop-type.enum';

@Entity()
export class Season {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ nullable: true })
    image_url?: string;

    @Column({ type: "timestamptz" })
    start_date: Date;

    @Column({ type: "timestamptz" })
    expected_end_date: Date;

    @Column({ type: "timestamptz", nullable: true })
    actual_end_date?: Date;

    @Column({ type: 'enum', enumName: 'season_status', enum: SeasonStatus, default: SeasonStatus.PENDING })
    status: SeasonStatus;

    @Column()
    expected_yield: number;

    @Column({ nullable: true })
    actual_yield?: number;

    @Column()
    yield_unit: string;

    @Column({ nullable: true })
    notes?: string;

    @Column({ type: 'enum', enumName: 'crop_type', enum: CropType })
    crop_type: CropType

    @CreateDateColumn({ type: "timestamptz" })
    created: Date;

    @UpdateDateColumn({ type: "timestamptz" })
    updated: Date;

    @ManyToOne(() => Plot, (plot) => plot.seasons)
    @JoinColumn({ name: "plot_id" })
    plot: Plot;

    @Column()
    plot_id: number;

    @OneToMany(() => SeasonDetail, (detail) => detail.season)
    season_details: SeasonDetail[];

    @ManyToOne(() => Farm)
    @JoinColumn({ name: "farm_id" })
    farm: Farm

    @Column()
    farm_id: number;
}