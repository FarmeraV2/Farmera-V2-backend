import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CropType } from '../enums/crop-type.enum';
import { Season } from './season.entity';

@Entity()
export class Plot {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    plot_name: string;

    @Column()
    crop_name: string;

    @Column({ enum: CropType })
    crop_type: CropType

    @Column({ nullable: true })
    area?: number;

    @Column({ type: "jsonb" })
    location: { lat: number; lng: number }

    @Column({ type: "timestamptz" })
    start_date: Date;

    @Column({ nullable: true })
    notes?: string;

    @CreateDateColumn({ type: "timestamptz" })
    created: Date

    @OneToMany(() => Season, (season) => season.plot)
    seasons: Season[];
}