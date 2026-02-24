import { Expose } from 'class-transformer';

export class NewProvinceDto {
    @Expose() code: number;
    @Expose() name: string;
    @Expose() phone_code: number;
}

export class NewWardDto {
    @Expose() code: number;
    @Expose() name: string;
    @Expose() province_code: number;
}

const newProvinceDtoProps = Object.keys(new NewProvinceDto());
export const newProvinceSelectFields = newProvinceDtoProps
    .map((prop) => {
        return `province.${prop}`;
    });

const newWardDtoProps = Object.keys(new NewWardDto());
export const newWardSelectFields = newWardDtoProps
    .map((prop) => {
        return `ward.${prop}`;
    })
