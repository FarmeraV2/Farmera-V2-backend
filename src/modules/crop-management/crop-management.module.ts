import { Module } from '@nestjs/common';
import { PlotService } from './plot/plot.service';
import { PlotController } from './plot/plot.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plot } from './entities/plot.entity';
import { Season } from './entities/season.entity';
import { SeasonDetail } from './entities/season-detail.entity';
import { Log } from './entities/log.entity';
import { SeasonService } from './season/season.service';
import { SeasonController } from './season/season.controller';
import { StepService } from './step/step.service';
import { StepController } from './step/step.controller';
import { LogService } from './log/log.service';
import { LogController } from './log/log.controller';
import { Step } from './entities/step.entity';
import { CropService } from './crop/crop.service';
import { CropController } from './crop/crop.controller';
import { Crop } from './entities/crop.entity';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { ProductModule } from '../product/product.module';
import { AuditorProfileController } from './auditor-profile/auditor-profile.controller';
import { AuditorProfileService } from './auditor-profile/auditor-profile.service';
import { AuditorProfile } from './entities/auditor-profile.entity';
import { VerificationService } from './verification/verification.service';
import { VerificationController } from './verification/verification.controller';
import { VerificationAssignment } from './entities/verification-assignment.entity';
import { ImageVerificationService } from './image-verification/image-verification.service';
import { ImageHash } from './entities/image-hash.entity';
import { LogImageVerificationResult } from './entities/log-image-verification-result.entity';
import { FileStorageModule } from 'src/core/file-storage/file-storage.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Plot, Season, SeasonDetail, Step, Log, Crop,
            ImageHash, LogImageVerificationResult,
            AuditorProfile, VerificationAssignment
        ]),
        BlockchainModule,
        ProductModule,
        FileStorageModule
    ],
    providers: [
        PlotService, SeasonService, StepService, LogService, CropService,
        AuditorProfileService, ImageVerificationService, VerificationService,
    ],
    controllers: [
        PlotController, SeasonController, StepController, LogController, CropController,
        AuditorProfileController, VerificationController
    ],
    exports: [
        SeasonService, StepService, LogService, PlotService, ImageVerificationService,
        TypeOrmModule,
    ],
})
export class CropManagementModule { }
