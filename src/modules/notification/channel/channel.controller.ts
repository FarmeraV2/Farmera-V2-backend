import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { Roles } from 'src/common/decorators/role.decorator';
import { UserRole } from 'src/common/enums/role.enum';
import { ChannelService } from './channel.service';
import { CreateChannelDto } from '../dtos/channel/create-channel.dto';
import { User } from 'src/common/decorators/user.decorator';
import { UserInterface } from 'src/common/types/user.interface';
import { Channel } from '../entities/channel.entity';
import { GetChannelDto } from '../dtos/channel/get-channel.dto';

@Controller('channel')
@Roles([UserRole.ADMIN])
export class ChannelController {

    constructor(private readonly channelService: ChannelService) { }

    @Post()
    async createChannel(@User() user: UserInterface, @Body() createChannelDto: CreateChannelDto) {
        return await this.channelService.createChannel(createChannelDto, user.id);
    }

    @Put()
    async updateChannel(@Body() updateChannel: Channel) {
        return await this.channelService.updateChannel(updateChannel);
    }

    @Delete(":id")
    async deleteChannel(@Param("id") id: number) {
        return await this.channelService.deleteChannel(id);
    }

    @Get()
    async getAllChannels(@Query() getChannelDto: GetChannelDto) {
        return await this.channelService.getAllChannels(getChannelDto);
    }
}
