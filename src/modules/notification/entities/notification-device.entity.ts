import { User } from "src/modules/user/entities/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"

@Entity()
export class NotificationDevice {
    @PrimaryGeneratedColumn()
    device_id: number;

    @Column()
    fcm_token: string;

    @Column({ nullable: true })
    phone?: string;

    @Column()
    is_deleted: boolean;

    @CreateDateColumn({ type: "timestamptz" })
    created: Date;

    @UpdateDateColumn({ type: "timestamptz" })
    updated: Date;

    @OneToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user: User;

    @Column()
    user_id: number
}