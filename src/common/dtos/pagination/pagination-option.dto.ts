import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min, } from 'class-validator';
import { Order } from 'src/common/enums/pagination.enum';

export class PaginationOptions {
    // Sort
    @IsEnum(Order)
    @IsOptional()
    readonly order?: Order = Order.ASC;

    @IsOptional()
    @IsString()
    readonly sort_by?: string;

    // Pagination
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @IsOptional()
    readonly page?: number = 1;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    @IsOptional()
    readonly limit?: number = 10;

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true')
    readonly all?: boolean;

    get skip(): number {
        return ((this.page ?? 1) - 1) * (this.limit ?? 10);
    }
}