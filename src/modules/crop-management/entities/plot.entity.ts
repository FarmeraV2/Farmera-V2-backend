import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { CropType } from '../enums/crop-type.enum';
import { Season } from './season.entity';
import { Farm } from 'src/modules/farm/entities/farm.entity';
import { Crop } from './crop.entity';

@Entity()
export class Plot {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    plot_name: string;

    @Column()
    crop_name: string;

    @Column({ nullable: true })
    area?: number;

    @Column({ type: "jsonb" })
    location: { lat: number; lng: number }

    @Column({ nullable: true })
    notes?: string;

    @Column('text', { array: true })
    image_urls: string[];

    @Column({ default: false })
    is_deleted: boolean;

    @CreateDateColumn({ type: "timestamptz" })
    created: Date

    @UpdateDateColumn({ type: "timestamptz" })
    updated: Date

    @ManyToOne(() => Farm)
    @JoinColumn({ name: "farm_id" })
    farm: Farm

    @Column()
    farm_id: number;

    @OneToMany(() => Season, (season) => season.plot)
    seasons: Season[];

    @OneToOne(() => Crop)
    @JoinColumn({ name: "crop_id" })
    crop: Crop;

    @Column()
    crop_id: number;
}