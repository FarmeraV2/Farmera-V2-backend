import { Expose, Type } from "class-transformer";
import { DeliveryAddressDto } from "src/modules/address/dtos/delivery-address.dto";
import { PublicUserDto } from "src/modules/user/dtos/user/user.dto";
import { FarmTransparencyMetricsDto } from "./farm-transparency-metrics.dto";
import { FarmStatus } from "../../enums/farm-status.enum";

export class FarmSummaryDto {
    @Expose() id: number;
    @Expose() farm_name: string;
    @Expose() description: string;
    @Expose() avatar_url: string;
}

const dtoProps = Object.keys(new FarmSummaryDto());
export const farmSummaryDtoSelectFields = dtoProps
    .map((prop) => `farm.${prop}`);

export class FarmDto {
    @Expose() id: number;
    @Expose() farm_id: string;
    @Expose() farm_name: string;
    @Expose() description: string;
    @Expose() avatar_url: string;
    @Expose() profile_image_urls: string[];
    @Expose() email: string;
    @Expose() phone: string;
    @Expose() tax_number: string;
    @Expose() farm_size?: number;
    @Expose() establish?: number;
    @Expose() created: Date;

    @Expose()
    @Type(() => PublicUserDto)
    owner: PublicUserDto;

    @Expose()
    @Type(() => FarmTransparencyMetricsDto)
    transparency_score?: FarmTransparencyMetricsDto;

    @Type(() => DeliveryAddressDto)
    @Expose() address: DeliveryAddressDto;
}

const farmDtoProps = Object.keys(new FarmDto());
export const farmDtoSelectFields = farmDtoProps
    .map((prop) => {
        if (prop === 'owner' || prop === 'address') return null;
        return `farm.${prop}`;
    })
    .filter((field): field is string => !!field);

export class FarmListResponseDto {
    @Expose() id: number;
    @Expose() farm_id: string;
    @Expose() farm_name: string;
    @Expose() description: string;
    @Expose() avatar_url: string;
    @Expose() status: FarmStatus;
    @Expose() created: Date;
}

const listFarmDtoProps = Object.keys(new FarmListResponseDto());
export const listFarmDtoSelectFields = listFarmDtoProps
    .map((prop) => {
        return `farm.${prop}`;
    })

export class AdminFarmDetailDto {
    @Expose() id: number;
    @Expose() farm_id: string;
    @Expose() farm_name: string;
    @Expose() description: string;
    @Expose() avatar_url: string;
    @Expose() profile_image_urls: string[];
    @Expose() email: string;
    @Expose() phone: string;
    @Expose() tax_number: string;
    @Expose() status: FarmStatus;
    @Expose() farm_size?: number;
    @Expose() establish?: number;
    @Expose() created: Date;
    @Expose() updated: Date;

    @Expose()
    @Type(() => PublicUserDto)
    owner: PublicUserDto;

    @Expose()
    @Type(() => FarmTransparencyMetricsDto)
    transparency_score?: FarmTransparencyMetricsDto;

    @Type(() => DeliveryAddressDto)
    @Expose() address: DeliveryAddressDto;
}

const adminFarmDtoProps = Object.keys(new AdminFarmDetailDto());
export const adminFarmDtoSelectFields = adminFarmDtoProps
    .map((prop) => {
        if (prop === 'owner' || prop === 'address') return null;
        return `farm.${prop}`;
    })
    .filter((field): field is string => !!field);