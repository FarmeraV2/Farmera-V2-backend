// import { Module } from '@nestjs/common';
// import { BlockchainModule } from '../blockchain/blockchain.module';
// import { TransparencyService } from './transparency/transparency.service';
// import { CropManagementModule } from '../crop-management/crop-management.module';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { TransparencyWeight } from './entities/transparency-weight.entity';
// import { TransparencyWeightService } from './transparency-weight/transparency-weight.service';
// import { FarmModule } from '../farm/farm.module';
// import { AuditModule } from 'src/core/audit/audit.module';
// import { TransparencyController } from './transparency/transparency.controller';
// import { VerificationModule } from '../verification/verification.module';

// @Module({
//     imports: [
//         TypeOrmModule.forFeature([TransparencyWeight]),
//         BlockchainModule,
//         AuditModule,
//         CropManagementModule,
//         FarmModule,
//         VerificationModule,
//     ],
//     providers: [TransparencyService, TransparencyWeightService],
//     exports: [TransparencyService],
//     controllers: [TransparencyController],
// })
// export class FtesModule { }
