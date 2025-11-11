import { Expose } from "class-transformer";
import { IsLatitude, IsLongitude } from "class-validator";

export class LocationRequestDto {
    @IsLatitude()
    lat: number;

    @IsLongitude()
    lng: number;
}

export class LocationDto {
    @Expose() lat: number;
    @Expose() lng: number;
}