import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { SeasonStatus } from '../enums/season-status.enum';
import { Plot } from './plot.entity';
import { SeasonDetail } from './season-detail.entity';

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

    @Column({ type: "timestamptz" })
    actual_end_date: Date;

    @Column({ enum: SeasonStatus })
    status: SeasonStatus;

    @Column()
    expected_yield: number;

    @Column()
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
    plot: Plot;

    @OneToMany(() => SeasonDetail, (detail) => detail.season)
    season_details: SeasonDetail[];
}