import { Controller, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { Public } from 'src/common/decorators/public.decorator';
import { PaymentService } from './payment.service';
import { PayosWebhookDto } from './dtos/payos-webhook.dto';
import { PayosService } from './payos.service';

@Controller('payment')
export class PaymentController {

    constructor (
        private readonly paymentService: PaymentService,
        private readonly payosService: PayosService,
    ) {}

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
        const result = await this.paymentService.handlePayOSCallback(body);
        console.log('Payos payment webhook handled successfully:', result);
        return { success: result };
    }
}
