import { Expose } from 'class-transformer';

export class OldProvinceDto {
    @Expose() code: number;
    @Expose() name: string;
    @Expose() phone_code: number;
    @Expose() ghn_code?: string;
}

export class OldDistrictDto {
    @Expose() code: number;
    @Expose() name: string;
    @Expose() province_code: number;
    @Expose() ghn_code?: string;
}

export class OldWardDto {
    @Expose() code: number;
    @Expose() name: string;
    @Expose() district_code: number;
    @Expose() ghn_code?: string;
}

const oldProvinceDtoProps = Object.keys(new OldProvinceDto());
export const oldProvinceSelectFields = oldProvinceDtoProps
    .map((prop) => {
        return `old_province.${prop}`;
    });

const oldDistrictDtoProps = Object.keys(new OldDistrictDto());
export const oldDistrictSelectFields = oldDistrictDtoProps
    .map((prop) => {
        return `old_district.${prop}`;
    })

const oldWardDtoProps = Object.keys(new OldWardDto());
export const oldWardSelectFields = oldWardDtoProps
    .map((prop) => {
        return `old_ward.${prop}`;
    })
