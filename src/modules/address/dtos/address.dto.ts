import { Expose } from "class-transformer";
import { AddressType } from "../enums/address-type.enums";

export class AddressDto {
    @Expose() location_id: number;
    @Expose() name: string;
    @Expose() phone: string
    @Expose() province_code: number;
    @Expose() ward_code: number;
    @Expose() street: string;
    @Expose() address_line: string;
    @Expose() postal_code: string;
    @Expose() type: string;
    @Expose() owner_type: AddressType;
    @Expose() is_primary: boolean;
    @Expose() created_at: Date;
    @Expose() updated_at: Date;
}