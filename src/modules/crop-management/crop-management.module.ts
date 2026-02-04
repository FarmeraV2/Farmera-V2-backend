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

@Module({
  imports: [
    TypeOrmModule.forFeature([Plot, Season, SeasonDetail, Step, Log, Crop]),
    BlockchainModule
  ],
  providers: [PlotService, SeasonService, StepService, LogService, CropService],
  controllers: [PlotController, SeasonController, StepController, LogController, CropController],
  exports: [SeasonService]
})
export class CropManagementModule { }
