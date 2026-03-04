import { Controller, Get, Param, Query } from '@nestjs/common';
import { Roles } from 'src/common/decorators/role.decorator';
import { UserRole } from 'src/common/enums/role.enum';
import { StepService } from './step.service';
import { ListStepDto } from '../dtos/step/list-step.dto';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('step')
@Roles([UserRole.ADMIN])
export class StepController {

    constructor(private readonly stepService: StepService) { }

    // @Get()
    // async listSteps(@Query() listStepDto: ListStepDto) {
    //     return await this.stepService.listSteps(listStepDto);
    // }

    @Public()
    @Get("crop/:cropId")
    async getSteps(@Query() listStepDto: ListStepDto, @Param("cropId") cropId: number) {
        return await this.stepService.listPublicStepsByCropId(listStepDto, cropId);
    }

    @Public()
    @Get(":id")
    async getSeasonSteps(@Param("id") id: number) {
        return await this.stepService.getSeasonStep(id);
    }
}
