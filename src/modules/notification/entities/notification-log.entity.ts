import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"
import { DeliveryStatus } from "../enums/delivery-status.enum";
import { NotificationReceiver } from "./notification-receiver.entity";

@Entity()
export class NotificationLog {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ enum: DeliveryStatus })
    status: DeliveryStatus;

    @Column()
    error_message: string;

    @CreateDateColumn({ type: "timestamptz" })
    created: Date;

    @ManyToOne(() => NotificationReceiver)
    notification_receiver: NotificationReceiver;
}