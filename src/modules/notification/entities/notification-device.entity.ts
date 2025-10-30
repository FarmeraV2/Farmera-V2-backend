import { User } from "src/modules/user/entities/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"

@Entity()
export class NotificationDevice {
    @PrimaryColumn({ type: "uuid" })
    device_id: string;

    @Column()
    fcm_token: string;

    @Column({ nullable: true })
    phone?: string;

    @Column({ default: false })
    is_deleted: boolean;

    @CreateDateColumn({ type: "timestamptz" })
    created: Date;

    @UpdateDateColumn({ type: "timestamptz" })
    updated: Date;

    @ManyToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user: User;

    @Column()
    user_id: number
}