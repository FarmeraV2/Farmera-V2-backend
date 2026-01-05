import { Module } from '@nestjs/common';
import { FarmController } from './farm/farm.controller';
import { FarmService } from './farm/farm.service';
import { BiometricService } from './biometric/biometric.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Farm } from './entities/farm.entity';
import { HttpModule } from '@nestjs/axios';
import { AddressModule } from '../address/address.module';
import { FileStorageModule } from 'src/core/file-storage/file-storage.module';
import { MulterModule } from '@nestjs/platform-express';
import { multerAsyncConfig } from 'src/config/multer.config';
import { AuditModule } from 'src/core/audit/audit.module';
import { HashService } from 'src/services/hash.service';
import { Identification } from './entities/identification.entity';
import { UserModule } from '../user/user.module';

@Module({
    imports: [
        MulterModule.registerAsync(multerAsyncConfig),
        TypeOrmModule.forFeature([Farm, Identification]),
        ConfigModule,
        HttpModule,
        AddressModule,
        FileStorageModule,
        AuditModule,
        UserModule,
    ],
    controllers: [FarmController],
    providers: [FarmService, BiometricService, HashService],
    exports: [FarmService],
})
export class FarmModule { }
