import { Controller, Get, Query } from '@nestjs/common';
import { TrustComputationService } from './trust-computation.service';
import { Public } from 'src/common/decorators/public.decorator';
import { IdentifierDto, MultiIdIdentifierDto } from '../dtos/identifier.dto';

@Controller('trust-computation')
export class TrustComputationController {
    constructor(private readonly trustComputationService: TrustComputationService) { }

    @Public()
    @Get("record")
    async getTrustRecord(@Query() query: IdentifierDto) {
        return await this.trustComputationService.getTrustRecord(query.identifier, query.id);
    }

    @Public()
    @Get("records")
    async getTrustRecords(@Query() query: MultiIdIdentifierDto) {
        return await this.trustComputationService.getTrustRecords(query.identifier, query.ids);
    }
}
