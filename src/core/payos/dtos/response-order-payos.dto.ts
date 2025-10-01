
//Cấu trúc dữ liệu trả về khi tạo đơn hàng PayOS
export class ResponseOrderPayOSDto {
    code: string;
    desc: string;
    data: ResponseOrderPayOSDataDto;
    signature: string;

}
export class ResponseOrderPayOSDataDto {
    bin: string;
    accountNumber: string;
    accountName: string;
    currency: string;
    paymentLinkId: string;
    amount: number;
    description: string;
    orderCode: string;
    expiredAt: string; //Bổ sung trường này (date: 1/10)
    status: string;
    checkoutUrl: string; // URL thanh toán
    qrCode: string; // qr code dưới dạng base 64
}