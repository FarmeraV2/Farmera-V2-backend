import { Expose } from "class-transformer";
import { LocationType } from "../../enums/location-type.enums";

export class LocationDto {
    @Expose() location_id: number;
    @Expose() name: string;
    @Expose() phone: string
    @Expose() city: string;
    @Expose() province: string;
    @Expose() district: string;
    @Expose() ward: string;
    @Expose() street: string;
    @Expose() address_line: string;
    @Expose() type: LocationType;
    @Expose() is_primary: boolean;
    @Expose() latitude: number;
    @Expose() longitude: number;
    @Expose() postal_code: string;
    @Expose() state: string;
    @Expose() created_at: Date;
    @Expose() updated_at: Date;
}