import { User } from "src/modules/user/entities/user.entity";
import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryColumn } from "typeorm"
import { PreferenceChannel } from "./preference-channel.entity";

@Entity()
export class UserPreference {
    @PrimaryColumn()
    id: number;

    @Column({ nullable: true })
    do_not_disturb_start?: string

    @Column({ nullable: true })
    do_not_disturb_end?: string

    @Column({ default: "Asia/Ho_Chi_Minh" })
    time_zone: string

    @OneToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user: User

    @Column()
    user_id: number

    @OneToMany(() => PreferenceChannel, (preference) => preference.user_preference)
    preference_channels: PreferenceChannel[]
}