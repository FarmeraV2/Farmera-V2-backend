// import { IsEnum, IsNotEmpty, IsNumber, IsPositive, IsString, Length } from "class-validator";
// import { NotificationChannelType } from "../../enums/notification-channel-type.enum";

// export class SendNotification {
//     @IsString()
//     @IsNotEmpty()
//     @Length(1, 70)
//     subject: string;

//     @IsString()
//     @IsNotEmpty()
//     content: string;

//     @IsEnum(NotificationChannelType)
//     notification_channel_type: NotificationChannelType;

//     @OneToMany(() => NotificationReceiver, (receiver) => receiver.notification)
//     notification_receiver: NotificationReceiver[];

//     @IsNumber()
//     @IsPositive()
//     template_id: number;

//     @IsNumber()
//     @IsPositive()
//     channel_id: number;
// }