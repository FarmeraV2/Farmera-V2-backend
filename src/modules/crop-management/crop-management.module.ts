import { Module } from '@nestjs/common';
import { PlotService } from './plot/plot.service';
import { PlotController } from './plot/plot.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plot } from './entities/plot.entity';
import { Season } from './entities/season.entity';
import { SeasonDetail } from './entities/season-detail.entity';
import { Log } from './entities/log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Plot, Season, SeasonDetail, Log])
  ],
  providers: [PlotService],
  controllers: [PlotController]
})
export class CropManagementModule { }
