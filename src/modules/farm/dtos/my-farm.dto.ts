import { Expose, Type } from "class-transformer";
import { DeliveryAddressDto } from "src/modules/address/dtos/delivery-address.dto";
import { FarmStatus } from "../enums/farm-status.enum";

export class MyFarmDto {
    @Expose() id: number;
    @Expose() farm_id: string;
    @Expose() farm_name: string;
    @Expose() description: string;
    @Expose() avatar_url: string;
    @Expose() profile_image_urls: string[];
    @Expose() certificate_img_urls: string[];
    @Expose() email: string;
    @Expose() phone: string;
    @Expose() tax_number: string;
    @Expose() status: FarmStatus;
    @Expose() created: Date;
    @Expose() updated: Date;

    @Type(() => DeliveryAddressDto)
    @Expose() address: DeliveryAddressDto;
}

const farmDtoProps = Object.keys(new MyFarmDto());
export const farmDtoSelectFields = farmDtoProps
    .map((prop) => {
        if (prop === 'address') return null;
        return `farm.${prop}`;
    })
    .filter((field): field is string => !!field);