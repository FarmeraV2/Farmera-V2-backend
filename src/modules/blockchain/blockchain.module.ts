import { Module } from '@nestjs/common';
import { ProcessTrackingService } from './process-tracking/process-tracking.service';
import { AuditorRegistryService } from './auditor/auditor-registry.service';
import { TrustComputationService } from './trustworthiness/trust-computation.service';
import { AuditorRegistryController } from './auditor/auditor-registry.controller';
import { StateService } from './state/state.service';
import { StateController } from './state/state.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlockchainSyncState } from './entities/blockchain-sync-state.entity';
import { TrustComputationController } from './trustworthiness/trust-computation.controller';
import { ProcessTrackingController } from './process-tracking/process-tracking.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BlockchainSyncState])],
  providers: [ProcessTrackingService, TrustComputationService, AuditorRegistryService, StateService,],
  exports: [ProcessTrackingService, TrustComputationService, AuditorRegistryService],
  controllers: [AuditorRegistryController, StateController, TrustComputationController, ProcessTrackingController],
})
export class BlockchainModule { }
