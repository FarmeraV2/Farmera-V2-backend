import { Controller, Logger } from '@nestjs/common';
import { SkipTransform } from 'src/common/decorators/skip.decorator';
import { PayosService } from './payos.service';

@Controller('payos')
@SkipTransform()
export class PayosController {
    private readonly logger = new Logger(PayosController.name);
    constructor(private readonly payosService: PayosService) {}
}
