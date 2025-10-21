import { Column, Entity, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm"
import { NotificationChannelType } from "../enums/notification-channel-type.enum";
import { UserPreference } from "./user-preference.entity";
import { Channel } from "./channel.entity";

@Entity()
export class PreferenceChannel {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ enum: NotificationChannelType })
    notification_channel_type: NotificationChannelType;

    @ManyToOne(() => UserPreference, (preference) => preference.preference_channels)
    user_preference: UserPreference;

    @ManyToOne(() => Channel, (channel) => channel.preference_channels)
    channel: Channel;
}