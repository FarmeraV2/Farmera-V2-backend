import { SetMetadata } from '@nestjs/common';

/**
 * Marks a route or handler to **skip response transformation**
 *
 * Dùng cho route cần bỏ qua **transform.interceptor**
 */
export const SKIP_TRANSFORM_KEY = 'skipTransform';
export const SkipTransform = () => SetMetadata(SKIP_TRANSFORM_KEY, true);
