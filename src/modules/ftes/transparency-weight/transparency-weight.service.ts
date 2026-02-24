import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TransparencyWeight } from '../entities/transparency-weight.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TransparencyWeightService {
    constructor(@InjectRepository(TransparencyWeight) private readonly transparencyWeightRepository: Repository<TransparencyWeight>) { }

    async getWeight(type: string, context: string): Promise<TransparencyWeight | null> {
        const result = await this.transparencyWeightRepository.findOneBy({
            type,
            context
        });
        return result;
    }
}
