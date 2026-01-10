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

    @Column({ type: 'enum', enumName: 'crop_type', enum: CropType })
    for_crop_type: CropType;
    

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



    @CreateDateColumn({ type: "timestamptz" })
    created: Date;

    @UpdateDateColumn({ type: "timestamptz" })
    updated: Date;

    @OneToMany(() => SeasonDetail, (detail) => detail.step)
    season_details: SeasonDetail[];

    @ManyToOne(() => Step, (step) => step.children, { nullable: true })
    @JoinColumn({ name: "parent_id" })
    parent?: Step;

    @Column({ nullable: true })
    parent_id?: number;

    @OneToMany(() => Step, (step) => step.parent)
    children?: Step[];
}