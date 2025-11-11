import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { StepStatus } from '../enums/step-status.enum';
import { StepEvaluation } from '../enums/step-evaluation';
import { Season } from './season.entity';
import { Step } from './step.entity';
import { Log } from './log.entity';

@Entity()
export class SeasonDetail {
    @PrimaryGeneratedColumn()
    id: number;

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

    @Column()
    season_id: number;

    @ManyToOne(() => Step, (step) => step.season_details)
    @JoinColumn({ name: "step_id" })
    step: Step;

    @Column()
    step_id: number;

    @OneToMany(() => Log, (log) => log.season_detail)
    logs?: Log[];
}