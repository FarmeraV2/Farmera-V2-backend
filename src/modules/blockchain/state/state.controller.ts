import { Body, Controller, Post } from '@nestjs/common';
import { StateService } from './state.service';
import { Roles } from 'src/common/decorators/role.decorator';
import { UserRole } from 'src/common/enums/role.enum';
import { CreateStateDto } from '../dtos/create-state.dto';

@Roles([UserRole.ADMIN])
@Controller('blockchain-state')
export class StateController {
    constructor(private readonly stateService: StateService) { }

    @Post()
    async createState(@Body() createDto: CreateStateDto) {
        return await this.stateService.createState(createDto);
    }
}
