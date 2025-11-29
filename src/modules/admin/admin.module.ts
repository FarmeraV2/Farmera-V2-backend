import { Module } from '@nestjs/common';
import { FarmController } from './farm/farm.controller';
import { FarmModule } from '../farm/farm.module';

@Module({
  imports: [FarmModule],
  controllers: [FarmController],
})
export class AdminModule { }
