import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Log } from '../entities/log.entity';
import { GetStepDto } from '../dtos/step/get-step.dto';

@Injectable()
export class LogService {

    private readonly logger = new Logger(LogService.name);

    constructor(
        @InjectRepository(Log) private readonly logRepository: Repository<Log>,
    ) { }

    async getSteps(getStepDto: GetStepDto) { }
}
