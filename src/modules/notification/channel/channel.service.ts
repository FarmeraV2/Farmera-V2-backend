import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channel } from '../entities/channel.entity';
import { CreateChannelDto } from '../dtos/channel/create-channel.dto';
import { ResponseCode } from 'src/common/constants/response-code.const';
import { GetChannelDto } from '../dtos/channel/get-channel.dto';
import { plainToInstance } from 'class-transformer';
import { PaginationTransform } from 'src/common/dtos/pagination/pagination-option.dto';
import { applyPagination } from 'src/common/utils/pagination.util';
import { PaginationResult } from 'src/common/dtos/pagination/pagination-result.dto';
import { PaginationMeta } from 'src/common/dtos/pagination/pagination-meta.dto';

@Injectable()
export class ChannelService {

    private readonly logger = new Logger(ChannelService.name);

    constructor(@InjectRepository(Channel) private channelRepository: Repository<Channel>) { }

    async createChannel(createChannelDto: CreateChannelDto, userId: number): Promise<Channel> {
        try {
            return await this.channelRepository.save({ ...createChannelDto, created_by: userId });
        }
        catch (error) {
            this.logger.error("Failed to create channel: ", error.message);
            throw new InternalServerErrorException({
                message: "Failed to create channel",
                code: ResponseCode.FAILED_TO_CREATE_CHANNEL,
            })
        }
    }

    async updateChannel(updateChannel: Channel): Promise<Channel> {
        try {
            return await this.channelRepository.save(updateChannel);
        }
        catch (error) {
            this.logger.error("Failed to update channel: ", error.message);
            throw new InternalServerErrorException({
                message: "Failed to update channel",
                code: ResponseCode.FAILED_TO_UPDATE_CHANNEL,
            })
        }
    }

    async deleteChannel(channelId: number): Promise<boolean> {
        try {
            const result = await this.channelRepository.delete(channelId);
            if (result.affected && result.affected > 0) {
                return true;
            }
            return false;
        }
        catch (error) {
            this.logger.error("Failed to create channel: ", error.message);
            throw new InternalServerErrorException({
                message: "Failed to create channel",
                code: ResponseCode.FAILED_TO_CREATE_CHANNEL,
            })
        }
    }

    async getAllChannels(getChannelDto: GetChannelDto): Promise<PaginationResult<Channel>> {
        const paginationOptions = plainToInstance(PaginationTransform<any>, getChannelDto);
        try {
            const queryBuilder = this.channelRepository.createQueryBuilder("channel");
            const totalItems = await applyPagination(queryBuilder, paginationOptions);

            // get result
            const channels = await queryBuilder.getMany();
            const meta = new PaginationMeta({
                paginationOptions,
                totalItems,
            });
            return new PaginationResult(channels, meta);
        }
        catch (error) {
            this.logger.error("Failed to get channels: ", error.message);
            throw new InternalServerErrorException({
                message: "Failed to get channels",
                code: ResponseCode.FAILED_TO_GET_CHANNEL,
            })
        }
    }

    async getDefaultChannelIds(): Promise<number[]> {
        try {
            const channels = await this.channelRepository.find({ select: ["id"], where: { default: true } });
            return channels.map((channel) => channel.id)
        }
        catch (error) {
            this.logger.error("Failed to get channel ids: ", error.message);
            throw new InternalServerErrorException({
                message: "Failed to get channel ids",
                code: ResponseCode.FAILED_TO_GET_CHANNEL,
            })
        }
    }
}
