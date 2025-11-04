import { IsNotEmpty, IsPhoneNumber, IsString, IsUUID } from "class-validator";

export class CreateNotificationDeviceDto {
    @IsUUID()
    device_id: string;

    @IsString()
    @IsNotEmpty()
    fcm_token: string;

    @IsPhoneNumber("VN")
    phone: string;
}

export class DeleteNotificationDeviceDto {
    @IsUUID()
    device_id: string;
}