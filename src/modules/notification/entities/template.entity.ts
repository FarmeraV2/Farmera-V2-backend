import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"
import { Notification } from "./notification.entity";

@Entity()
export class Template {
    @PrimaryGeneratedColumn()
    template_id: number

    @Column({ length: 70 })
    name: string;

    @Column({ length: 70 })
    subject: string;

    @Column()
    content: string;

    @Column({ default: false })
    is_deleted: boolean;

    @CreateDateColumn({ type: "timestamptz" })
    created: Date;

    @UpdateDateColumn({ type: "timestamptz" })
    updated: Date;

    @Column()
    created_by: number;

    @Column()
    updated_by: number;

    @OneToMany(() => Notification, (notification) => notification.template)
    notifications?: Notification[]
}