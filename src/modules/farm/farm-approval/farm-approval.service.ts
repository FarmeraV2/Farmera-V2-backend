import { HttpException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FarmApproval } from '../entities/farm-approval.entity';
import { EntityManager, Repository } from 'typeorm';
import { CreateApprovalDto } from '../dtos/approval/create-approval.dto';
import { ResponseCode } from 'src/common/constants/response-code.const';

@Injectable()
export class FarmApprovalService {
    private readonly logger = new Logger(FarmApprovalService.name);

    constructor(
        @InjectRepository(FarmApproval) private farmApprovalRepository: Repository<FarmApproval>,
    ) { }

    async createApproval(adminId: number, createApprovalDto: CreateApprovalDto, manager?: EntityManager): Promise<FarmApproval> {
        const repo = manager ? manager.getRepository(FarmApproval) : this.farmApprovalRepository;
        try {
            const approval = repo.create({ admin_id: adminId, ...createApprovalDto });
            return await repo.save(approval);
        } catch (error) {
            if (error instanceof HttpException) throw error;
            this.logger.error(error.message);
            throw new InternalServerErrorException({
                message: 'Failed to create approval',
                code: ResponseCode.FAILED_TO_CREATE_APPROVAL,
            });
        }
    }

    async getFarmApprovals(farmId: number): Promise<FarmApproval[]> {
        try {
            return await this.farmApprovalRepository.find({
                where: { farm_id: farmId },
                order: { id: "DESC" }
            })
        } catch (error) {
            if (error instanceof HttpException) throw error;
            this.logger.error(error.message);
            throw new InternalServerErrorException({
                message: 'Failed to get approval',
                code: ResponseCode.FAILED_TO_GET_APPROVALS,
            });
        }
    }

}
