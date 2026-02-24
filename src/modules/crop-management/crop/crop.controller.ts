import { Controller, Get, Query } from '@nestjs/common';
import { CropService } from './crop.service';
import { GetCropDto } from '../dtos/crop/get-crop.dto';

@Controller('crop')
export class CropController {

    constructor(private readonly CropService: CropService) { }

    @Get()
    async getCrops(@Query() getCropsDto: GetCropDto) {
        return await this.CropService.getCrops(getCropsDto);
    }
}
