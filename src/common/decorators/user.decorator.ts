import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserInterface } from '../types/user.interface';

/**
 * Custom decorator to extract the user from the request object
 * Usage: @User() user: UserInterface
 *
 * Can also extract specific properties:
 * @User('id') userId: string
 */
export const User = createParamDecorator((data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: UserInterface = request.user;

    // If a specific property is requested, return just that
    if (data) {
        return user?.[data];
    }

    // Otherwise return the entire user object
    return user;
});
