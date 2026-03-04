import { Injectable, Logger } from '@nestjs/common';
import { PaginationResult } from 'src/common/dtos/pagination/pagination-result.dto';
import { UserRole } from 'src/common/enums/role.enum';
import { GetUserDetailDto } from 'src/modules/user/dtos/user/get-user-detail.dto';
import { ListUserDto } from 'src/modules/user/dtos/user/list-user.dto';
import { UpdateUserStatus } from 'src/modules/user/dtos/user/update-user-status.dto';
import { PublicUserDto, UserDto } from 'src/modules/user/dtos/user/user.dto';
import { UserService } from 'src/modules/user/user/user.service';

@Injectable()
export class UserManagementService {

    private readonly logger = new Logger(UserManagementService.name);

    constructor(private readonly userService: UserService) { }

    async listUsers(listUserDto: ListUserDto): Promise<PaginationResult<PublicUserDto>> {
        return await this.userService.listUsers(listUserDto);
    }

    async getUserDetail(userId: number, getUserDetailDto: GetUserDetailDto): Promise<UserDto> {
        return await this.userService.getUserById(userId, getUserDetailDto.include_addresses, getUserDetailDto.include_payment_methods);
    }

    async updateUserRole(userId: number, newRole: UserRole): Promise<boolean> {
        return await this.userService.updateRole(userId, newRole);
    }

    async updateUserStatus(updateUserStatusDto: UpdateUserStatus): Promise<boolean> {
        return await this.userService.updateUserStatus(updateUserStatusDto);
    }
}
