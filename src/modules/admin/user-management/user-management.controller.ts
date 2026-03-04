import { Body, Controller, Get, Param, Patch, Put, Query } from '@nestjs/common';
import { UserManagementService } from './user-management.service';
import { UserRole } from 'src/common/enums/role.enum';
import { Roles } from 'src/common/decorators/role.decorator';
import { GetUserDetailDto } from 'src/modules/user/dtos/user/get-user-detail.dto';
import { UpdateUserStatus } from '../../user/dtos/user/update-user-status.dto';
import { ListUserDto } from 'src/modules/user/dtos/user/list-user.dto';
import { UpdateUserRoleDto } from 'src/modules/user/dtos/user/update-user-role.dto';

@Roles([UserRole.ADMIN])
@Controller('user-management')
export class UserManagementController {

    constructor(private readonly userManagementService: UserManagementService) { }

    @Get("detail/:userId")
    async getUserDetail(@Param("userId") userId: number, @Query() getDetailDto: GetUserDetailDto) {
        return await this.userManagementService.getUserDetail(userId, getDetailDto);
    }

    @Patch("role")
    async updateUserRole(@Body() updateUserRoleDto: UpdateUserRoleDto) {
        return await this.userManagementService.updateUserRole(updateUserRoleDto.user_id, updateUserRoleDto.role);
    }

    @Patch("status")
    async updateUserStatus(@Body() updateUserStatusDto: UpdateUserStatus) {
        return await this.userManagementService.updateUserStatus(updateUserStatusDto);
    }

    @Get()
    async listUsers(@Query() listUserDto: ListUserDto) {
        return await this.userManagementService.listUsers(listUserDto);
    }

}
