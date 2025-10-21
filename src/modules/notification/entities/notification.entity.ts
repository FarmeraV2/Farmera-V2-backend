import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"
import { NotificationReceiver } from "./notification-receiver.entity";
import { Template } from "./template.entity";
import { Channel } from "./channel.entity";

@Entity()
export class Notification {
    @PrimaryGeneratedColumn()
    notification_id: number;

    @Column({ length: 70 })
    subject: string;

    @Column()
    content: string;

    @CreateDateColumn({ type: "timestamptz" })
    created: Date;

    @UpdateDateColumn({ type: "timestamptz" })
    updated: Date

    @OneToMany(() => NotificationReceiver, (receiver) => receiver.notification)
    notification_receiver: NotificationReceiver[];

    @ManyToOne(() => Template)
    @JoinColumn({ name: "template_id" })
    template: Template;

    @Column()
    template_id: number;

    @ManyToOne(() => Channel)
    @JoinColumn({ name: "channel_id" })
    channel: Channel;

    @Column()
    channel_id: number;
}