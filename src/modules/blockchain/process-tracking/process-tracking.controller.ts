import { Controller, Get, Param, Query } from '@nestjs/common';
import { Public } from 'src/common/decorators/public.decorator';
import { ProcessTrackingService } from './process-tracking.service';

@Controller('process-tracking')
export class ProcessTrackingController {
    constructor(private readonly processTracking: ProcessTrackingService) { }

    @Public()
    @Get("log/:id")
    async getLog(@Param("id") id: number) {
        return await this.processTracking.getHashedLog(id);
    }

    @Public()
    @Get("step/log/:id")
    async getTrustRecords(@Param("id") id: number) {
        return await this.processTracking.getHashedLogs(id);
    }
}
