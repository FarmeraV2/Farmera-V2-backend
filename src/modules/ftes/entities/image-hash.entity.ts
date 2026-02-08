import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class ImageHash {
    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @Column({ type: 'varchar', length: 16 })
    phash: string;

    @Column()
    image_url: string;

    @Column()
    log_id: number;

    @Column()
    farm_id: number;

    @CreateDateColumn({ type: 'timestamptz' })
    created: Date;
}
