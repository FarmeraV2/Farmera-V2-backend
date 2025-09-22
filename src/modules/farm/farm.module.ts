import { Module } from '@nestjs/common';
import { FarmController } from './farm/farm.controller';
import { FarmService } from './farm/farm.service';
import { BiometricService } from './biometric/biometric.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Farm } from './entities/farm.entity';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    TypeOrmModule.forFeature([Farm]),
    ConfigModule,
    HttpModule
  ],
  controllers: [FarmController],
  providers: [FarmService, BiometricService]
})
export class FarmModule { }
