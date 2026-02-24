import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Audit } from './entities/audit.entity';
import { AuditDto } from './dtos/audit.dto';

@Injectable()
export class AuditService {
    private readonly logger = new Logger(AuditService.name);

    constructor(@InjectRepository(Audit) private readonly auditRepository: Repository<Audit>) { }

    async log(audit: AuditDto, manager?: EntityManager) {
        try {
            const repo = manager ? manager.getRepository(Audit) : this.auditRepository;

            const insert = repo.create(audit);

            return await repo.insert(insert);
        } catch (error) {
            this.logger.error(`Audit error: ${error.message}`)
            throw error;
        }
    }
}
