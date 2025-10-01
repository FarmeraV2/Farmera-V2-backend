import { Controller, Logger, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { SkipTransform } from 'src/common/decorators/skip.decorator';
import { PayosService } from './payos.service';
import { Public } from 'src/common/decorators/public.decorator';
import { PayosWebhookDto } from './dtos/payos-webhook.dto';

@Controller('payos')
@SkipTransform()
export class PayosController {
    private readonly logger = new Logger(PayosController.name);
    constructor(private readonly payosService: PayosService) { }


    // Webhook nhận callback từ PayOS khi có thanh toán thành công hoặc thất bại
    @Public()
    @Post('payment')
    async handlePaymentWebhook(@Req() req: Request): Promise<any> {
        const body: PayosWebhookDto = {
            code: req.body?.code || '',
            desc: req.body?.desc || '',
            success: req.body?.success || false,
            data: {
                amount: req.body?.data?.amount || 0,
                orderCode: req.body?.data?.orderCode || 0,
                description: req.body?.data?.description || '',
                accountNumber: req.body?.data?.accountNumber || '',
                reference: req.body?.data?.reference || '',
                transactionDateTime: req.body?.data?.transactionDateTime || '',
                currency: req.body?.data?.currency || '',
                paymentLinkId: req.body?.data?.paymentLinkId || '',
                code: req.body?.data?.code || '',
                desc: req.body?.data?.desc || '',
                virtualAccountNumber: req.body?.data?.virtualAccountNumber || '',
                counterAccountBankId: req.body?.data?.counterAccountBankId || '',
                counterAccountBankName: req.body?.data?.counterAccountBankName || '',
                counterAccountName: req.body?.data?.counterAccountName || '',
                counterAccountNumber: req.body?.data?.counterAccountNumber || '',
                virtualAccountName: req.body?.data?.virtualAccountName || '',
            },
            signature: req.body?.signature || '',
        };
        const verifySignatur = await this.payosService.verifySignature(body);
        if (!verifySignatur) {
            this.logger.warn('Invalid signature in PayOS webhook');
            return { success: false, message: 'Invalid signature' };
        }
        //TODO: Xử lý logic khi nhận được webhook từ PayOS, ví dụ cập nhật trạng thái đơn hàng trong hệ thống
        return { success: true, message: 'Webhook received and signature verified' };
        
        
        //HÀM CŨ

        //const result = await this.paymentClientService.handlePaymentCallback(body);
        //console.log('Payos payment webhook handled successfully:', result);
        //return { success: result };
    }

    @Public()
    @Post('cancel')
    async handleCancelWebhook(@Req() req: Request): Promise<any> {
        //TODO: Xử lý logic khi nhận được webhook hủy từ PayOS
        return null;
    }

    @Public()
    @Post('return')
    async handleReturnWebhook(@Req() req: Request): Promise<any> {
        //TODO: Xử lý logic khi nhận được webhook hoàn tiền từ PayOS
        return null;
    }
}
