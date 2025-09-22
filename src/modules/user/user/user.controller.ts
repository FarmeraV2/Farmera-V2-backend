import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
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
        return await this.userService.getUserById(user.id, getDetailDto.include_locations, getDetailDto.include_payment_methods);
    }

    @Put('profile')
    async updateProfile(@User() user: UserInterface, @Body() req: UpdateProfileDto) {
        return await this.userService.updateUserProfile(user.id, req);
    }

    @Public()
    @Get(':userId')
    async getUserById(@Param('userId') userId: string) {
        return await this.userService.getPublicUser(userId);
    }

    // @Roles([UserRole.ADMIN])
    // @Get("detail/:userId")
    // async getUserDetail(@Param("userId") userId: number, @Query() getDetailDto: GetUserDetailDto) {
    //     return await this.userService.getUserDetail(userId, getDetailDto);
    // }

    // @Roles(UserRole.ADMIN)
    // @Put("role")
    // async updateUserRole(@Body() updateUserRoleDto: UpdateUserRoleDto) {
    //     return await this.userService.updateUserRole(updateUserRoleDto.user_id, updateUserRoleDto.role, updateUserRoleDto.farm_id);
    // }

    // @Roles(UserRole.ADMIN)
    // @Put("status")
    // async updateUserStatus(@Body() updateUserStatusDto: UpdateUserStatus) {
    //     return await this.userService.updateUserStatus(updateUserStatusDto.user_id, updateUserStatusDto.status);
    // }

    // @Roles(UserRole.ADMIN)
    // @Get("all")
    // async listUsers(@Query() listUserDto: ListUserDto) {
    //     return await this.userService.listUsers(listUserDto);
    // }
}
