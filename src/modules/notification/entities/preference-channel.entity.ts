import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm"
import { NotificationChannelType } from "../enums/notification-channel-type.enum";
import { Channel } from "./channel.entity";
import { User } from "src/modules/user/entities/user.entity";

@Entity()
export class PreferenceChannel {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ enum: NotificationChannelType })
    notification_channel_type: NotificationChannelType;

    @Column({ default: true })
    active: boolean;

    @ManyToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user: User;

    @Column()
    user_id: number;

    @Column()
    user_preference_id: number;

    @ManyToOne(() => Channel, (channel) => channel.preference_channels)
    @JoinColumn({ name: "channel_id" })
    channel: Channel;

    @Column()
    channel_id: number;
}