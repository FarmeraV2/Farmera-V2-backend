import { PaginationMeta } from './pagination-meta.dto';

export class PaginationResult<T> {
    readonly data: T[];
    readonly pagination?: PaginationMeta;

    constructor(data: T[], meta?: PaginationMeta) {
        this.data = data;
        this.pagination = meta;
    }
}
