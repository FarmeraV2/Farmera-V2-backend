import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm"
import { DeliveryStatus } from "../enums/delivery-status.enum";
import { User } from "src/modules/user/entities/user.entity";
import { Notification } from "./notification.entity";
import { NotificationLog } from "./notification-log.entity";

@Entity()
export class NotificationReceiver {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ enum: DeliveryStatus, default: DeliveryStatus.PENDING })
    delivery_status: DeliveryStatus;

    @Column({ type: "timestamptz" })
    sent_at: Date;

    @Column({ type: "timestamptz" })
    read_at: Date;

    @ManyToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user: User;

    @Column()
    user_id: number;

    @ManyToOne(() => Notification, (notification) => notification.notification_receiver)
    notification: Notification;

    @OneToMany(() => NotificationLog, (log) => log.notification_receiver)
    logs: NotificationLog[];
}