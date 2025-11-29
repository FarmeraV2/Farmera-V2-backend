import { Controller } from '@nestjs/common';
import { FarmService } from 'src/modules/farm/farm/farm.service';

@Controller('farm')
export class FarmController {

    constructor(private readonly farmService: FarmService) { }

}
