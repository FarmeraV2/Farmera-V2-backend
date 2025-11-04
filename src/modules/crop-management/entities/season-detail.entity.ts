import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { StepStatus } from '../enums/step-status.enum';
import { StepEvaluation } from '../enums/step-evaluation';
import { Season } from './season.entity';
import { Step } from './step.entity';
import { Log } from './log.entity';

@Entity()
export class SeasonDetail {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ enum: StepStatus })
    step_status: StepStatus;

    @Column({ enum: StepEvaluation })
    step_evaluation: StepEvaluation

    @Column({ nullable: true })
    notes?: string;

    @ManyToOne(() => Season, (season) => season.season_details)
    season: Season;

    @ManyToOne(() => Step, (step) => step.season_details)
    step: Step;

    @OneToMany(() => Log, (log) => log.season_detail)
    logs: Log[];
}