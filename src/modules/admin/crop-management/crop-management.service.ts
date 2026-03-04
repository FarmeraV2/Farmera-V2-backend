import { Injectable } from '@nestjs/common';
import { CropService } from 'src/modules/crop-management/crop/crop.service';
import { CreateCropDto } from 'src/modules/crop-management/dtos/crop/create-crop.dto';
import { CreateStepDto } from 'src/modules/crop-management/dtos/step/create-step.dto';
import { Crop } from 'src/modules/crop-management/entities/crop.entity';
import { Step } from 'src/modules/crop-management/entities/step.entity';
import { StepService } from 'src/modules/crop-management/step/step.service';

@Injectable()
export class CropManagementService {

    constructor(
        private readonly cropService: CropService,
        private readonly stepService: StepService
    ) { }

    async createCrop(createCropDto: CreateCropDto): Promise<Crop> {
        return await this.cropService.createCrop(createCropDto);
    }

    async createStep(createStepDto: CreateStepDto): Promise<Step> {
        return await this.stepService.createStep(createStepDto);
    }
}
