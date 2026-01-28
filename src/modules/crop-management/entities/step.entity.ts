import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { SeasonDetail } from './season-detail.entity';
import { StepType } from '../enums/step-type.enum';
import { CropType } from '../enums/crop-type.enum';


@Entity()
export class Step {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    description: string;

    @Column({ nullable: true })
    notes?: string;

    @Column()
    order: number;

    @Column({ default: false })
    repeated: boolean;

    @Column({ default: false })
    is_optional: boolean;

    @Column({ default: 1 })
    min_logs: number;

    @Column({ type: 'enum', enumName: 'step_type', enum: StepType })
    type: StepType;

    @Column({ nullable: true })
    interval_date: number;

    @CreateDateColumn({ type: "timestamptz" })
    created: Date;

    @UpdateDateColumn({ type: "timestamptz" })
    updated: Date;

    @OneToMany(() => SeasonDetail, (detail) => detail.step)
    season_details: SeasonDetail[];
}