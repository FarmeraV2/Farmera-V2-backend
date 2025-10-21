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

    @CreateDateColumn({ type: "timestamptz" })
    created: Date

    @UpdateDateColumn({ type: "timestamptz" })
    updated: Date

    @OneToMany(() => Notification, (notification) => notification.template)
    notifications: Notification[]
}