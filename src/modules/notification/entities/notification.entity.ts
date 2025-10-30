import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"
import { NotificationReceiver } from "./notification-receiver.entity";
import { Template } from "./template.entity";
import { Channel } from "./channel.entity";
import { NotificationChannelType } from "../enums/notification-channel-type.enum";

@Entity()
export class Notification {
    @PrimaryGeneratedColumn()
    notification_id: number;

    @Column({ length: 70 })
    subject: string;

    @Column()
    content: string;

    @Column({ enum: NotificationChannelType })
    notification_channel_type: NotificationChannelType;

    @CreateDateColumn({ type: "timestamptz" })
    created: Date;

    @UpdateDateColumn({ type: "timestamptz" })
    updated: Date

    @OneToMany(() => NotificationReceiver, (receiver) => receiver.notification)
    notification_receiver: NotificationReceiver[];

    @ManyToOne(() => Template, { nullable: true })
    @JoinColumn({ name: "template_id" })
    template?: Template;

    @Column({ nullable: true })
    template_id?: number;

    @ManyToOne(() => Channel)
    @JoinColumn({ name: "channel_id" })
    channel: Channel;

    @Column()
    channel_id: number;
}