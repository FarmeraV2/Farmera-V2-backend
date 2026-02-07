import { Column, CreateDateColumn, Entity, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class TransparencyWeight {
    @PrimaryColumn()
    type: string;

    @PrimaryColumn()
    context: string;

    @Column({ nullable: true })
    description: string;

    @Column()
    key: string;

    @Column()
    weight: number;

    @CreateDateColumn({ type: "timestamptz" })
    created: Date;

    @UpdateDateColumn({ type: "timestamptz" })
    updated: Date;
}