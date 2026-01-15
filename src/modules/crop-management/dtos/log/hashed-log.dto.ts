import { Expose, Type } from "class-transformer";
import { LogType } from "../../enums/log-type.enum";
import { LocationDto } from "src/common/dtos/location/location.dto";

export class HashedLog {
    @Expose() id: number;
    @Expose() name: string;
    @Expose() description: string;
    @Expose() type: LogType;
    @Expose() image_urls: string[];
    @Expose() video_urls: string[];
    @Expose()
    @Type(() => LocationDto)
    location: LocationDto;
    @Expose() notes?: string;
    @Expose() created: Date;
    @Expose() season_detail_id: number;
    @Expose() farm_id: number;
}