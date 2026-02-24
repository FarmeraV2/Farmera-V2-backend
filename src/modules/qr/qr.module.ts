import { Module } from '@nestjs/common';
import { QrService } from './qr.service';
import { QrController } from './qr.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Qr } from './entities/qr.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Qr])],
  providers: [QrService],
  controllers: [QrController]
})
export class QrModule { }
