import { Injectable, CanActivate, ExecutionContext, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/role.decorator';
import { UserRole } from 'src/common/enums/role.enum';
import { UserInterface } from '../types/user.interface';
import { ResponseCode } from '../constants/response-code.const';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
        if (isPublic) {
            // Skip authentication for public routes
            return true;
        }

        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [context.getHandler(), context.getClass()]);
        if (!requiredRoles) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user as UserInterface;
        if (!user || !user.role) {
            throw new ForbiddenException({
                message: 'No user role found',
                code: ResponseCode.ROLE_NOT_FOUND
            });
        }
        if (!requiredRoles.includes(user.role)) {
            throw new ForbiddenException({
                message: 'Insufficient role',
                code: ResponseCode.INSUFFICIENT_ROLE,
            });
        }
        if (user.role === UserRole.FARMER) {
            if (!user.farm_id || !user.farm_uuid) throw new InternalServerErrorException('Something went wrong');
        }
        return true;
    }
}
