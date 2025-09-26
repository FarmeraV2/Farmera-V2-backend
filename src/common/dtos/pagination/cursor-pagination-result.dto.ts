import { CursorPaginationMeta } from './cursor-pagination-meta.dto';

export class CursorPaginationResult<T> {
    readonly data: T[];
    readonly pagination?: CursorPaginationMeta;

    constructor(data: T[], meta?: CursorPaginationMeta) {
        this.data = data;
        this.pagination = meta;
    }
}
