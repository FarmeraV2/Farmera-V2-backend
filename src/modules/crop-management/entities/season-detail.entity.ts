import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { StepStatus } from '../enums/step-status.enum';
import { StepEvaluation } from '../enums/step-evaluation';
import { Season } from './season.entity';
import { Step } from './step.entity';
import { Log } from './log.entity';

@Entity()
export class SeasonDetail {
    @PrimaryColumn()
    season_id: number;

    @PrimaryColumn()
    step_id: number;

    @Column({ type: 'enum', enumName: 'step_status', enum: StepStatus, default: StepStatus.PENDING })
    step_status: StepStatus;

    @Column({ type: 'enum', enumName: 'step_evaluation', enum: StepEvaluation, nullable: true })
    step_evaluation: StepEvaluation

    @CreateDateColumn({ type: "timestamptz" })
    created: Date;

    @UpdateDateColumn({ type: "timestamptz" })
    updated: Date;

    @ManyToOne(() => Season, (season) => season.season_details)
    @JoinColumn({ name: "season_id" })
    season: Season;

    @ManyToOne(() => Step, (step) => step.season_details)
    @JoinColumn({ name: "step_id" })
    step: Step;

    @OneToMany(() => Log, (log) => log.season_detail)
    logs?: Log[];
}