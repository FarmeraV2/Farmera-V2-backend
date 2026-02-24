import { Farm } from 'src/modules/farm/entities/farm.entity';
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class ImageHash {
    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @Column({ type: "bit", length: 64 })
    phash: string;

    @Column()
    image_url: string;

    @Column({ nullable: true })
    source: string;

    @Column({ nullable: true })
    source_id: number;

    @ManyToOne(() => Farm)
    @JoinColumn({ name: "farm_id" })
    farm: Farm;

    @Column()
    farm_id: number;

    @CreateDateColumn({ type: 'timestamptz' })
    created: Date;
}
