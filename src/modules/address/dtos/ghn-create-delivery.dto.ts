import { Type } from "class-transformer";
import { IsArray, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min, ValidateNested } from "class-validator";
import { ItemDeliveryDto } from "./item-delivery.dto";

export enum GhnRequiredNote {
    CHO_THU_HANG = 'CHOTHUHANG',
    CHO_XEM_HANG_KHONG_THU = 'CHOXEMHANGKHONGTHU',
    KHONG_CHO_XEM_HANG = 'KHONGCHOXEMHANG',
}


export enum GhnPaymentTypeId {
    NGUOI_GUI_THANH_TOAN = 1,
    NGUOI_NHAN_THANH_TOAN = 2,
}

export class CreateGhnOrderDto {

    // @IsNotEmpty()
    // @IsString()
    // @MaxLength(1024)
    from_name?: string;

    // @IsNotEmpty()
    // @IsString()
    from_phone?: string;

    // @IsNotEmpty()
    // @IsString()
    // @MaxLength(1024)
    from_address?: string;

    // @IsNotEmpty()
    // @IsString()
    from_ward_name?: string;

    // @IsOptional()
    from_ward_code?: string;

    // @IsNotEmpty()
    // @IsString()
    from_district_name?: string;

    // @IsOptional()
    from_district_id?: number;

    // @IsNotEmpty()
    // @IsString()
    from_province_name?: string;


    // @IsNotEmpty()
    // @IsString()
    // @MaxLength(1024)
    to_name: string;

    // @IsNotEmpty()
    // @IsString()
    to_phone: string;

    // @IsNotEmpty()
    // @IsString()
    // @MaxLength(1024)
    to_address: string;

    // @IsNotEmpty()
    // @IsString()
    to_ward_name: string;

    // @IsOptional()
    to_ward_code?: string;

    // @IsNotEmpty()
    // @IsString()
    to_district_name: string;

    // @IsOptional()
    to_district_id?: number;

    // @IsNotEmpty()
    // @IsString()
    to_province_name: string;


    // @IsOptional()
    // @IsString()
    return_phone?: string;

    // @IsOptional()
    // @IsString()
    // @MaxLength(1024)
    return_address?: string;

    // @IsOptional()
    // @IsString()
    return_district_name?: string;

    // @IsOptional()
    // @Type(() => Number)
    return_district_id?: number;

    // @IsOptional()
    // @Type(() => Number)
    deliver_station_id?: number;

    // @IsOptional()
    // @IsString()
    return_ward_code?: string;

    // @IsOptional()
    // @IsString()
    return_province_name?: string;


    // @IsOptional()
    // @IsString()
    // @MaxLength(50)
    client_order_code?: string;

    // @IsOptional()
    // @IsInt()
    // @Min(0)
    // @Max(50000000)
    cod_amount?: number = 0;

    // @IsOptional()
    // @IsString()
    // @MaxLength(2000)
    content?: string;


    // @IsNotEmpty()
    // @IsInt()
    // @Max(50000)
    weight: number; // gram

    // @IsOptional()
    // @IsInt()
    // @Max(200)
    length?: number; // cm

    // @IsOptional()
    // @IsInt()
    // @Max(200)
    width?: number; // cm

    // @IsOptional()
    // @IsInt()
    // @Max(200)
    height?: number; // cm

    // @IsOptional()
    // @IsInt()
    // @Min(1)
    pick_station_id?: number;

    // @IsOptional()
    // @IsInt()
    // @Min(0)
    // @Max(5000000)
    insurance_value?: number = 0;

    // @IsOptional()
    // @IsString()
    coupon?: string;



    // @IsNotEmpty()
    // @IsEnum(GhnPaymentTypeId)
    payment_type_id: GhnPaymentTypeId;

    // @IsOptional()
    // @IsString()
    // @MaxLength(5000)
    note?: string;

    // @IsNotEmpty()
    // @IsEnum(GhnRequiredNote)
    required_note: GhnRequiredNote;

    // @IsOptional()
    // @IsArray()
    pick_shift?: number[];

    // @IsOptional()
    // @IsInt()
    pickup_time?: number;

    // @IsNotEmpty()
    // @IsArray()
    items: ItemDeliveryDto[];

    // @IsOptional()
    // @IsInt()
    cod_failed_amount?: number;
}