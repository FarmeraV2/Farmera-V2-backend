import { Column, CreateDateColumn, Entity, OneToMany, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { StepCropType } from '../enums/step-crop-type.enum';
import { SeasonDetail } from './season-detail.entity';

@Entity()
export class Step {
    @PrimaryColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    description: string;

    @Column({ nullable: true })
    notes: string;

    @Column({ enum: StepCropType })
    for_crop_type: StepCropType;

    @Column()
    order: number;

    @Column({ default: false })
    is_optional: boolean;

    @Column({ default: 1 })
    min_logs: number;

    @CreateDateColumn({ type: "timestamptz" })
    created: Date;

    @UpdateDateColumn({ type: "timestamptz" })
    updated: Date;

    @OneToMany(() => SeasonDetail, (detail) => detail.step)
    season_details: SeasonDetail[];
}