import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsEnum, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';

export enum GhnWebhookType {
    CREATE = 'create',
    SWITCH_STATUS = 'Switch_status',
    UPDATE_WEIGHT = 'Update_weight',
    UPDATE_COD = 'Update_cod',
    UPDATE_FEE = 'Update_fee',
}

export enum GhnOrderStatus {
    READY_TO_PICK = 'ready_to_pick',
    PICKING = 'picking',
    CANCEL = 'cancel',
    MONEY_COLLECT_PICKING = 'money_collect_picking',
    PICKED = 'picked',
    STORING = 'storing',
    TRANSPORTING = 'transporting',
    SORTING = 'sorting',
    DELIVERING = 'delivering',
    MONEY_COLLECT_DELIVERING = 'money_collect_delivering',
    DELIVERED = 'delivered',
    DELIVERY_FAIL = 'delivery_fail',
    WAITING_TO_RETURN = 'waiting_to_return',
    RETURN = 'return',
    RETURN_TRANSPORTING = 'return_transporting',
    RETURN_SORTING = 'return_sorting',
    RETURNING = 'returning',
    RETURN_FAIL = 'return_fail',
    RETURNED = 'returned',
    EXCEPTION = 'exception',
    DAMAGE = 'damage',
    LOST = 'lost',
}

export class GhnWebhookFeeDto {
    @IsNumber()
    @IsOptional()
    CODFailedFee?: number;

    @IsNumber()
    @IsOptional()
    CODFee?: number;

    @IsNumber()
    @IsOptional()
    Coupon?: number;

    @IsNumber()
    @IsOptional()
    DeliverRemoteAreasFee?: number;

    @IsNumber()
    @IsOptional()
    DocumentReturn?: number;

    @IsNumber()
    @IsOptional()
    DoubleCheck?: number;

    @IsNumber()
    @IsOptional()
    Insurance?: number;

    @IsNumber()
    @IsOptional()
    MainService?: number;

    @IsNumber()
    @IsOptional()
    PickRemoteAreasFee?: number;

    @IsNumber()
    @IsOptional()
    R2S?: number;

    @IsNumber()
    @IsOptional()
    Return?: number;

    @IsNumber()
    @IsOptional()
    StationDO?: number;

    @IsNumber()
    @IsOptional()
    StationPU?: number;

    @IsNumber()
    @IsOptional()
    Total?: number;
}

export class GhnWebhookDto {
    @IsNumber()
    @IsOptional()
    CODAmount?: number;

    @IsOptional()
    CODTransferDate?: string | null;

    @IsString()
    @IsOptional()
    ClientOrderCode?: string;

    @IsNumber()
    @IsOptional()
    ConvertedWeight?: number;

    @IsString()
    @IsOptional()
    Description?: string;

    @IsObject()
    @ValidateNested()
    @Type(() => GhnWebhookFeeDto)
    @IsOptional()
    Fee?: GhnWebhookFeeDto;

    @IsNumber()
    @IsOptional()
    Height?: number;

    @IsBoolean()
    @IsOptional()
    IsPartialReturn?: boolean;

    @IsNumber()
    @IsOptional()
    Length?: number;

    @IsString()
    @IsNotEmpty()
    OrderCode: string;

    @IsString()
    @IsOptional()
    PartialReturnCode?: string;

    @IsNumber()
    @IsOptional()
    PaymentType?: number;

    @IsString()
    @IsOptional()
    Reason?: string;

    @IsString()
    @IsOptional()
    ReasonCode?: string;

    @IsNumber()
    @IsOptional()
    ShopID?: number;

    @IsEnum(GhnOrderStatus)
    @IsOptional()
    Status?: GhnOrderStatus;

    @IsString()
    @IsOptional()
    Time?: string;

    @IsNumber()
    @IsOptional()
    TotalFee?: number;

    @IsEnum(GhnWebhookType)
    @IsNotEmpty()
    Type: GhnWebhookType;

    @IsString()
    @IsOptional()
    Warehouse?: string;

    @IsNumber()
    @IsOptional()
    Weight?: number;

    @IsNumber()
    @IsOptional()
    Width?: number;
}
