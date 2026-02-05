import { forwardRef, Module } from '@nestjs/common';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { TransparencyService } from './transparency/transparency.service';
import { CropManagementModule } from '../crop-management/crop-management.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransparencyWeight } from './entities/transparency-weight.entity';
import { TransparencyWeightService } from './transparency-weight/transparency-weight.service';
import { FarmModule } from '../farm/farm.module';
import { AuditModule } from 'src/core/audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TransparencyWeight]),
    BlockchainModule,
    AuditModule,
    forwardRef(() => CropManagementModule),
    forwardRef(() => FarmModule),
  ],
  providers: [TransparencyService, TransparencyWeightService],
  exports: [TransparencyService]
})
export class FtesModule { }
