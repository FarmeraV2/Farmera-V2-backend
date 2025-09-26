import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Order } from 'src/common/enums/pagination.enum';

export abstract class CursorPaginationOptions<T = string> {
    @IsOptional()
    abstract sort_by: T;

    @IsOptional()
    @IsEnum(Order)
    readonly order: Order = Order.DESC;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    @IsOptional()
    readonly limit: number = 10;

    @IsOptional()
    @IsString()
    readonly cursor?: string;
}

export class CursorPaginationTransform<T> extends CursorPaginationOptions<T> {
    sort_by: T;
}