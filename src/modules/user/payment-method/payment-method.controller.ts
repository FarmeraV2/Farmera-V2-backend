import { Controller } from '@nestjs/common';
import { PaymentMethodService } from './payment-method.service';

@Controller('payment-method')
export class PaymentMethodController {
    constructor(private readonly paymentMethodService: PaymentMethodService) {}

    // // Payment Method Management Endpoints
    // @Get('payment-methods')
    // async getUserPaymentMethods(@User() user: UserInterface) {
    //     return await this.userService.getUserPaymentMethods(user.id);
    // }

    // @Post('payment-method')
    // async createPaymentMethod(
    //     @User() user: UserInterface,
    //     @Body() req: any, // TODO: Import CreatePaymentMethodDto
    // ) {
    //     return await this.userService.addPaymentMethod(user.id, req);
    // }

    // @Put('payment-method/:paymentMethodId')
    // async updatePaymentMethod(
    //     @User() user: UserInterface,
    //     @Param('paymentMethodId') paymentMethodId: number,
    //     @Body() req: UpdatePaymentMethodDto,
    // ) {
    //     return await this.userService.updatePaymentMethod(
    //         user.id,
    //         paymentMethodId,
    //         req,
    //     );
    // }

    // @Delete('payment-method/:paymentMethodId')
    // async deletePaymentMethod(
    //     @User() user: UserInterface,
    //     @Param('paymentMethodId') paymentMethodId: number,
    // ) {
    //     return await this.userService.deletePaymentMethod(user.id, paymentMethodId);
    // }
}
