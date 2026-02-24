import { IsEnum, IsOptional, IsString } from 'class-validator';
import { GhnRequiredNote } from 'src/modules/address/dtos/ghn-create-delivery.dto';

export class ConfirmOrderDeliveryDto {
    @IsString()
    shipping_carrier: string;

    @IsOptional()
    @IsEnum(GhnRequiredNote)
    required_note?: GhnRequiredNote;
}
