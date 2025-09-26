import { Injectable, CanActivate, ExecutionContext, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/role.decorator';
import { UserRole } from 'src/common/enums/role.enum';
import { UserInterface } from '../types/user.interface';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [context.getHandler(), context.getClass()]);
        if (!requiredRoles) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user as UserInterface;
        if (!user || !user.role) {
            throw new ForbiddenException('No user role found');
        }
        if (!requiredRoles.includes(user.role)) {
            throw new ForbiddenException('Insufficient role');
        }
        if (user.role === UserRole.FARMER) {
            if (!user.farm_id || !user.farm_uuid) throw new InternalServerErrorException('Something went wrong');
        }
        return true;
    }
}
