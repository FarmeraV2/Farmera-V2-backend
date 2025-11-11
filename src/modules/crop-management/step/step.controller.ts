import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Roles } from 'src/common/decorators/role.decorator';
import { UserRole } from 'src/common/enums/role.enum';
import { StepService } from './step.service';
import { CreateStepDto } from '../dtos/step/create-step.dto';
import { ListStepDto } from '../dtos/step/list-step.dto';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('step')
@Roles([UserRole.ADMIN])
export class StepController {

    constructor(private readonly stepService: StepService) { }

    @Post()
    async createStep(@Body() createStepDto: CreateStepDto) {
        return await this.stepService.createStep(createStepDto);
    }

    @Get()
    async listSteps(@Query() listStepDto: ListStepDto) {
        return await this.stepService.listSteps(listStepDto);
    }

    @Public()
    @Get("public")
    async getSteps(@Query() listStepDto: ListStepDto) {
        return await this.stepService.listPublicSteps(listStepDto);
    }

}
