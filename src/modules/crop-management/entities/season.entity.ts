import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { SeasonStatus } from '../enums/season-status.enum';
import { Plot } from './plot.entity';
import { SeasonDetail } from './season-detail.entity';
import { Farm } from 'src/modules/farm/entities/farm.entity';

@Entity()
export class Season {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ type: "timestamptz" })
    start_date: Date;

    @Column({ type: "timestamptz" })
    expected_end_date: Date;

    @Column({ type: "timestamptz", nullable: true })
    actual_end_date?: Date;

    @Column({ enum: SeasonStatus, default: SeasonStatus.PENDING })
    status: SeasonStatus;

    @Column()
    expected_yield: number;

    @Column({ nullable: true })
    actual_yield: number;

    @Column()
    yield_unit: string;

    @Column({ nullable: true })
    notes?: string;

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