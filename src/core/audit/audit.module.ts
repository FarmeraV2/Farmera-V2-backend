import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Audit } from './entities/audit.entity';
import { AuditEvent } from './entities/audit-event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Audit, AuditEvent])],
  providers: [AuditService],
  exports: [AuditService]
})
export class AuditModule { }
