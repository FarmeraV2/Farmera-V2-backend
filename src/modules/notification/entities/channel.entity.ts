import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"
import { PreferenceChannel } from "./preference-channel.entity";
import { Notification } from "./notification.entity";

@Entity()
export class Channel {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 70, unique: true })
    name: string;

    @Column()
    description: string;

    @Column({ default: false })
    default: boolean;

    @CreateDateColumn()
    created: Date

    @UpdateDateColumn()
    updated: Date

    @Column()
    created_by: number;

    @OneToMany(() => PreferenceChannel, (preference) => preference.channel)
    preference_channels?: PreferenceChannel[]

    @OneToMany(() => Notification, (notification) => notification.channel)
    notifications?: Notification[];
}