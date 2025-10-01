import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PayosService } from './payos.service';
import { PayosController } from './payos.controller';

@Module({
  imports: [HttpModule],
  providers: [PayosService],
  controllers: [PayosController],
  exports: [PayosService],
})
export class PayosModule {}
