import { PaginationOptions } from './pagination-option.dto';

export interface PaginationMetaParameters {
    paginationOptions: PaginationOptions;
    totalItems: number;
}

export class PaginationMeta {
    readonly page: number;
    readonly limit: number;
    readonly totalItems: number;
    readonly totalPages: number;
    readonly hasPreviousPage: boolean;
    readonly hasNextPage: boolean;

    constructor({ paginationOptions, totalItems }: PaginationMetaParameters) {
        this.page = Number(paginationOptions.page);
        this.limit = Number(paginationOptions.limit);
        this.totalItems = totalItems;
        this.totalPages = Math.ceil(this.totalItems / this.limit);
        this.hasPreviousPage = this.page > 1;
        this.hasNextPage = this.page < this.totalPages;
    }
}