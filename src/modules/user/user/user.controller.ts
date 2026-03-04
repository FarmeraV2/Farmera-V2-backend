import { Body, Controller, Get, Param, Patch, Put, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { Public } from 'src/common/decorators/public.decorator';
import { UserInterface } from 'src/common/types/user.interface';
import { User } from 'src/common/decorators/user.decorator';
import { UpdateProfileDto } from '../dtos/user/update-profile.dto';
import { GetUserDetailDto } from '../dtos/user/get-user-detail.dto';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Get('profile')
    async getUserProfile(@User() user: UserInterface, @Query() getDetailDto: GetUserDetailDto) {
        return await this.userService.getUserById(user.id, getDetailDto.include_addresses, getDetailDto.include_payment_methods);
    }

    @Patch('profile')
    async updateProfile(@User() user: UserInterface, @Body() req: UpdateProfileDto) {
        return await this.userService.updateUserProfile(user.id, req);
    }

    @Public()
    @Get(':userId')
    async getUserById(@Param('userId') userId: number) {
        return await this.userService.getPublicUser(userId);
    }
}
