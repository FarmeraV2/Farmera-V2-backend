import { PaginationMeta } from './pagination-meta.dto';

export interface PaginationResult<T> {
    readonly data: T[];
    readonly pagination?: PaginationMeta;
}