import { Module } from '@nestjs/common';
import { FarmController } from './farm/farm.controller';
import { FarmService } from './farm/farm.service';
import { BiometricService } from './biometric/biometric.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Farm } from './entities/farm.entity';
import { HttpModule } from '@nestjs/axios';
import { AddressModule } from '../address/address.module';

@Module({
    imports: [TypeOrmModule.forFeature([Farm]), ConfigModule, HttpModule, AddressModule],
    controllers: [FarmController],
    providers: [FarmService, BiometricService],
    exports: [FarmService],
})
export class FarmModule {}
