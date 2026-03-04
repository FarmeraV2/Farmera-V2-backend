import { Body, Controller, Post, Put } from '@nestjs/common';
import { CropManagementService } from './crop-management.service';
import { CreateStepDto } from 'src/modules/crop-management/dtos/step/create-step.dto';
import { CreateCropDto } from 'src/modules/crop-management/dtos/crop/create-crop.dto';
import { Roles } from 'src/common/decorators/role.decorator';
import { UserRole } from 'src/common/enums/role.enum';

@Controller('crop-management')
@Roles([UserRole.ADMIN])
export class CropManagementController {

    constructor(private readonly cropManagementService: CropManagementService) { }

    @Post("crop")
    async createCrop(@Body() createCropDto: CreateCropDto) {
        return await this.cropManagementService.createCrop(createCropDto);
    }

    @Post()
    async createStep(@Body() createStepDto: CreateStepDto) {
        return await this.cropManagementService.createStep(createStepDto);
    }

    // @Put("crop")
    // async updateCrop() {
    //     return await this.cropManagementService.updateCrop();
    // }

    // @Post("step")
    // async createStep() {
    //     return await this.cropManagementService.createStep();
    // }

    // @Put("step")
    // async updateStep() {
    //     return await this.cropManagementService.updateStep();
    // }
}
