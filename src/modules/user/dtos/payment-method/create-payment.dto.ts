import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, Matches } from "class-validator";
import { PaymentProvider } from "../../enums/payment-provider.enum";

export class CreatePaymentDto {
    @IsEnum(PaymentProvider)
    @IsNotEmpty()
    provider: PaymentProvider;

    @IsString()
    @IsNotEmpty()
    external_id?: string;

    @IsString()
    @IsOptional()
    last_four?: string;

    @IsString()
    @IsOptional()
    card_type?: string;

    @IsString()
    @IsOptional()
    @Matches(/^(0[1-9]|1[0-2])\/\d{2}$/, {
        message: 'Expiry date should be in MM/YY format',
    })
    expiry_date?: string;

    @IsString()
    @IsOptional()
    cardholder_name?: string;

    @IsString()
    @IsOptional()
    billing_address?: string;

    @IsString()
    @IsOptional()
    token?: string;

    @IsBoolean()
    @IsOptional()
    is_default?: boolean = true;
}