import { Expose } from "class-transformer";

/**
 * For customer user
 */
export class AddressDto {
    @Expose() address_id: number;
    @Expose() name: string;
    @Expose() phone: string
    @Expose() province_code: number;
    @Expose() ward_code: number;
    @Expose() street: string;
    @Expose() postal_code: string;
    @Expose() type: string;
    @Expose() is_primary: boolean;
    @Expose() created_at: Date;
    @Expose() updated_at: Date;
}