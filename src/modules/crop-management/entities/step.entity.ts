import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { SeasonDetail } from './season-detail.entity';
import { StepType } from '../enums/step-type.enum';
import { Crop } from './crop.entity';


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

    @Column({ nullable: true })
    min_day_duration: number;

    @Column({ nullable: true })
    max_day_duration: number;

    @CreateDateColumn({ type: "timestamptz" })
    created: Date;

    @UpdateDateColumn({ type: "timestamptz" })
    updated: Date;

    @OneToMany(() => SeasonDetail, (detail) => detail.step)
    season_details: SeasonDetail[];

    @ManyToOne(() => Crop)
    @JoinColumn({ name: "crop_id" })
    crop: Crop;

    @Column()
    crop_id: number;
}