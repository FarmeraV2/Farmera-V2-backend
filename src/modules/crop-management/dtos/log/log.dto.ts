import { Expose, Type } from "class-transformer";
import { LocationDto } from "src/common/dtos/location/location.dto";

export class LogDto {
    @Expose() id: number;
    @Expose() name: string;
    @Expose() description: string;
    @Expose() image_urls: string[];
    @Expose() video_urls: string[];
    @Expose()
    @Type(() => LocationDto)
    location: LocationDto
    @Expose() transaction_hash?: string;
    @Expose() notes?: string;
    @Expose() created: Date;
    @Expose() season_detail_id: number;
    @Expose() farm_id: number;
    @Expose() farm_name?: string;
    @Expose() is_active: boolean;
}