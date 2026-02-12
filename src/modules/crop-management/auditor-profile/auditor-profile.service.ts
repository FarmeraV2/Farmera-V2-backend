import { BadRequestException, HttpException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ResponseCode } from 'src/common/constants/response-code.const';
import { RegisterAuditorDto } from '../dtos/auditor-profile/register-auditor.dto';
import { AuditorProfile } from '../entities/auditor-profile.entity';
import { AuditorRegistryService } from 'src/modules/blockchain/auditor/auditor-registry.service';
import { Address } from 'web3';
import { AuditorInfo } from 'src/modules/blockchain/interfaces/auditor.interface';

@Injectable()
export class AuditorProfileService {

    private readonly logger = new Logger(AuditorProfileService.name);

    constructor(
        @InjectRepository(AuditorProfile) private readonly auditorProfileRepo: Repository<AuditorProfile>,
        private readonly auditorRegistryService: AuditorRegistryService,
    ) { }

    async registerAuditor(dto: RegisterAuditorDto): Promise<AuditorProfile> {
        try {
            const existing = await this.auditorProfileRepo.findOne({
                where: [
                    { user_id: dto.user_id },
                    { wallet_address: dto.wallet_address },
                ],
            });

            if (existing) {
                throw new BadRequestException({
                    message: 'Auditor already registered',
                    code: ResponseCode.AUDITOR_ALREADY_REGISTERED,
                });
            }

            const profile = this.auditorProfileRepo.create({
                user_id: dto.user_id,
                wallet_address: dto.wallet_address.toLowerCase(),
            });

            return await this.auditorProfileRepo.save(profile);
        } catch (error) {
            if (error instanceof BadRequestException) throw error;
            this.logger.error(`Failed to register auditor: ${error.message}`);
            throw new InternalServerErrorException({
                message: 'Failed to register auditor',
                code: ResponseCode.INTERNAL_ERROR,
            });
        }
    }

    async validateAuditor(userId: number): Promise<number> {
        try {
            const profile = await this.auditorProfileRepo.findOne({
                select: ['id'],
                where: { user_id: userId, is_active: true }
            });
            if (!profile) {
                throw new InternalServerErrorException({
                    message: "Something went wrong, you're an auditor but your profile is not found",
                    code: ResponseCode.INTERNAL_ERROR
                });
            }
            return profile.id;
        } catch (error) {
            if (error instanceof HttpException) throw error;
            this.logger.error(error.message);
            throw new InternalServerErrorException({
                message: 'Failed to validate farmer',
                code: ResponseCode.FAILED_TO_VALIDATE,
            });
        }
    }

    async getAuditorIdsByAddresses(address: Address[]): Promise<number[]> {
        const auditors = await this.auditorProfileRepo.find({
            where: { wallet_address: In(address) }
        });
        return auditors.map((e) => e.id);
    }
}
