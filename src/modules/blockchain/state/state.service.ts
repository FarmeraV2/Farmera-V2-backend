import { HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BlockchainSyncState } from '../entities/blockchain-sync-state.entity';
import { Repository } from 'typeorm';
import { CreateStateDto } from '../dtos/create-state.dto';
import { ResponseCode } from 'src/common/constants/response-code.const';

@Injectable()
export class StateService {
    private readonly logger = new Logger(StateService.name);

    constructor(
        @InjectRepository(BlockchainSyncState) private readonly blockchainSyncStateRepo: Repository<BlockchainSyncState>
    ) { }

    async createState(createDto: CreateStateDto): Promise<BlockchainSyncState> {
        try {
            return this.blockchainSyncStateRepo.save(createDto);
        }
        catch (error) {
            this.logger.error(`Failed to create blockchain sync state: ${error.message}`);
            throw new InternalServerErrorException({
                message: "Failed to create blockchain sync state",
                code: ResponseCode.INTERNAL_ERROR,
            })
        }
    }

    async updateState(udpateDto: Partial<CreateStateDto>): Promise<BlockchainSyncState> {
        try {
            const newState = this.blockchainSyncStateRepo.create(udpateDto);
            return this.blockchainSyncStateRepo.save(newState);
        }
        catch (error) {
            this.logger.error(`Failed to update blockchain sync state: ${error.message}`);
            throw new InternalServerErrorException({
                message: "Failed to update blockchain sync state",
                code: ResponseCode.INTERNAL_ERROR,
            })
        }
    }

    async getState(key: string): Promise<BlockchainSyncState | null> {
        try {
            const state = await this.blockchainSyncStateRepo.findOne({
                where: { key }
            })
            return state;
        }
        catch (error) {
            if (error instanceof HttpException) throw error;
            this.logger.error(`Failed to update blockchain sync state: ${error.message}`);
            throw new InternalServerErrorException({
                message: "Failed to update blockchain sync state",
                code: ResponseCode.INTERNAL_ERROR,
            })
        }
    }
}
