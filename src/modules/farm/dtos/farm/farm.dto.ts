import { Expose, Type } from "class-transformer";
import { DeliveryAddressDto } from "src/modules/address/dtos/delivery-address.dto";
import { PublicUserDto } from "src/modules/user/dtos/user/user.dto";

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

    @Expose()
    @Type(() => PublicUserDto)
    owner: PublicUserDto;


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