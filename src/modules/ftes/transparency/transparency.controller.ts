import { Controller, Post } from '@nestjs/common';
import { TransparencyService } from './transparency.service';

@Controller('transparency')
export class TransparencyController {
    constructor(private readonly transparencyService: TransparencyService) { }

    @Post()
    async post() {
        return this.transparencyService.handleCalcFarmTSCron();
    }
}
