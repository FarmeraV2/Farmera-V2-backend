import { Module } from '@nestjs/common';
import { TrustworthinessService } from './trustworthiness/trustworthiness.service';

@Module({
  providers: [TrustworthinessService]
})
export class FtesModule {}
