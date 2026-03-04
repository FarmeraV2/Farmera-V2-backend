import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { CropManagementModule } from '../crop-management/crop-management.module';
import { FarmModule } from '../farm/farm.module';
import { AuditModule } from 'src/core/audit/audit.module';
import { TransparencyService } from './transparency/transparency.service';
import { TransparencyController } from './transparency/transparency.controller';
import { TransparencyWeight } from './entities/transparency-weight.entity';
import { TransparencyWeightService } from './transparency-weight/transparency-weight.service';
import { OrderModule } from '../order/order.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([TransparencyWeight]),
        BlockchainModule,
        AuditModule,
        CropManagementModule,
        FarmModule,
        OrderModule,
    ],
    providers: [
        TransparencyService,
        TransparencyWeightService,
    ],
    exports: [TransparencyService],
    controllers: [TransparencyController],
})
export class FtesModule { }
