export interface CursorPaginationMetaParameters {
    next_cursor: string | null;
}

export class CursorPaginationMeta {
    readonly next_cursor: string | null;

    constructor({ next_cursor }: CursorPaginationMetaParameters) {
        this.next_cursor = next_cursor;
    }
}
