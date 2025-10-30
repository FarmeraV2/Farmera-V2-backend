import { Column, Entity, JoinColumn, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm"
import { NotificationChannelType } from "../enums/notification-channel-type.enum";
import { UserPreference } from "./user-preference.entity";
import { Channel } from "./channel.entity";

@Entity()
export class PreferenceChannel {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ enum: NotificationChannelType })
    notification_channel_type: NotificationChannelType;

    @Column({ default: true })
    active: boolean;

    @ManyToOne(() => UserPreference, (preference) => preference.preference_channels)
    @JoinColumn({ name: "user_preference_id" })
    user_preference: UserPreference;

    @Column()
    user_preference_id: number;

    @ManyToOne(() => Channel, (channel) => channel.preference_channels)
    @JoinColumn({ name: "channel_id" })
    channel: Channel;

    @Column()
    channel_id: number;
}