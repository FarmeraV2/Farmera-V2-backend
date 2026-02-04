import { Module } from '@nestjs/common';
import { ProcessTrackingService } from './process-tracking/process-tracking.service';
import { TrustworthinessService } from './trustworthiness/trustworthiness.service';

@Module({
  providers: [ProcessTrackingService, TrustworthinessService],
  exports: [ProcessTrackingService]
})
export class BlockchainModule { }
