export enum ProductStatus {
    PRE_ORDER = 'PRE_ORDER',
    NOT_YET_OPEN = 'NOT_YET_OPEN',
    OPEN_FOR_SALE = 'OPEN_FOR_SALE',
    SOLD_OUT = 'SOLD_OUT',
    CLOSED = 'CLOSED',
    DELETED = 'DELETED',
}

export const ProductStatusOrder: Record<ProductStatus, number> = {
    [ProductStatus.NOT_YET_OPEN]: 1,
    [ProductStatus.PRE_ORDER]: 2,
    [ProductStatus.OPEN_FOR_SALE]: 3,
    [ProductStatus.SOLD_OUT]: 4,
    [ProductStatus.CLOSED]: 5,
    [ProductStatus.DELETED]: 6,
};