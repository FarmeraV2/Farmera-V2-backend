import { Module } from '@nestjs/common';
import { PayosService } from './payos.service';
import { PayosController } from './payos.controller';

@Module({
  providers: [PayosService],
  controllers: [PayosController],
  exports: [PayosService],
})
export class PayosModule {}
