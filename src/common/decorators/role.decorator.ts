import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'src/modules/user/enums/role.enum';

/**
 * Only specified role can access the routes which marked by this decorator
 * 
 * Áp role của route
 */
export const ROLES_KEY = 'roles';
export const Roles = (role: UserRole[]) => SetMetadata(ROLES_KEY, role); 