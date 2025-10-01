export class PayosWebhookDto {
    code: string;
    desc: string;
    success: boolean;
    data: PayOsDataWebhookDto;
    signature: string;
}
export class PayOsDataWebhookDto {
    orderCode: number;
    amount: number;
    description: string;
    accountNumber: string;
    reference: string;
    transactionDateTime: string;
    currency: string;
    paymentLinkId: string;
    code: string;
    desc: string;
    counterAccountBankId?: string;
    counterAccountBankName?: string;
    counterAccountName?: string;
    counterAccountNumber?: string;
    virtualAccountName?: string;
    virtualAccountNumber?: string;
}