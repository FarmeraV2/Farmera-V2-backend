import { Expose, Type } from 'class-transformer';
import { OldDistrictDto, OldProvinceDto, OldWardDto } from './old-address.dto';
import { NewProvinceDto, NewWardDto } from './new-address.dto';
import { AddressType } from '../enums/address-type.enums';

/**
 * For customer user
 */
export class DeliveryAddressDto {
    @Expose() address_id: number;
    @Expose() name: string;
    @Expose() phone: string;
    @Expose() street: string;
    @Expose() postal_code?: string;
    @Expose() type: string;
    @Expose() is_primary: boolean;
    @Expose() created_at: Date;
    @Expose() updated_at: Date;
    @Expose() owner_type: AddressType;


    @Expose()
    @Type(() => OldProvinceDto)
    old_province?: OldProvinceDto;
    @Expose()
    @Type(() => OldDistrictDto)
    old_district?: OldDistrictDto;
    @Expose()
    @Type(() => OldWardDto)
    old_ward?: OldWardDto;

    @Expose()
    @Type(() => NewProvinceDto)
    province?: NewProvinceDto;
    @Expose()
    @Type(() => NewWardDto)
    ward?: OldWardDto;
}

const dtoProps = Object.keys(new DeliveryAddressDto());
export const deliveryAddressSelectFields = dtoProps
    .map((prop) => {
        if (
            prop === 'old_province' || prop === 'old_district' || prop === 'old_ward' ||
            prop === 'province' || prop === 'ward'
        ) return null;
        return `delivery_address.${prop}`;
    })
    .filter((field): field is string => !!field);
