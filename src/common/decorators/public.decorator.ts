import { SetMetadata } from '@nestjs/common';

/**
 * Marks a route as publicly accessible, bypassing JWT authentication
 * 
 * Route public
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true); 