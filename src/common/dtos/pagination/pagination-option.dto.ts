import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, Max, Min, } from 'class-validator';
import { Order } from 'src/common/enums/pagination.enum';

export abstract class PaginationOptions<T> {
    // Sort
    @IsEnum(Order)
    @IsOptional()
    readonly order: Order = Order.ASC;

    @IsOptional()
    abstract sort_by: T;

    // Pagination
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @IsOptional()
    readonly page: number = 1;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    @IsOptional()
    readonly limit: number = 10;

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true')
    readonly all?: boolean;

    get skip(): number {
        return ((this.page ?? 1) - 1) * (this.limit ?? 10);
    }
}

export class PaginationTransform<T> extends PaginationOptions<T> {
    sort_by: T;
}