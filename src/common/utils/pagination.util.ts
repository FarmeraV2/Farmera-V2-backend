import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { PaginationOptions } from '../dtos/pagination/pagination-option.dto';
import { BadRequestException } from '@nestjs/common';
import { ResponseCode } from '../constants/response-code.const';

/**
 * @function applyPagination - Applies pagination constraints to a product query builder
 * @param {SelectQueryBuilder<Entity>} qb - The query builder instance for the T entity
 * @param {PaginationOptions} paginationOptions - Object containing pagination parameters (page, limit, skip)
 *
 * @returns {Promise<number>} - Returns the total number of items before pagination, or -1 if the requested page is invalid
 */
export async function applyPagination<Entity extends ObjectLiteral>(qb: SelectQueryBuilder<Entity>, paginationOptions: PaginationOptions<any>): Promise<number> {
    const totalItems = await qb.getCount();

    const totalPages = Math.ceil(totalItems / paginationOptions.limit);

    const currentPage = paginationOptions.page;

    if (totalPages > 0 && currentPage > totalPages) {
        throw new BadRequestException({
            message: 'Invalid page',
            code: ResponseCode.INVALID_PAGE
        });
    }

    qb.skip(paginationOptions.skip).take(paginationOptions.limit);
    return totalItems;
}