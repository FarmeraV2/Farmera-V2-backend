import { CropType } from "../enums/crop-type.enum";
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class Crop {
    @PrimaryGeneratedColumn()
    id: string;

    @Column()
    name: string;

    @Column({ type: "enum", "enum": CropType, "enumName": "crop_type" })
    crop_type: CropType;

    @Column()
    description: string;

    @Column('text', { array: true })
    image_urls: string[];

    @Column({ nullable: true })
    max_seasons: number;

    @CreateDateColumn()
    created: Date;

    @UpdateDateColumn()
    updated: Date;
}