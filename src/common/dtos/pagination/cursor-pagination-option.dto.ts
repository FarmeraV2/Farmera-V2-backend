import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { Order } from 'src/common/enums/pagination.enum';

export class CursorPagination {
    @IsOptional()
    @IsString()
    sort_by?: string;

    @IsOptional()
    @IsEnum(Order)
    order? = 'DESC';

    @IsOptional()
    @IsNumber()
    @IsPositive()
    @Type(() => Number)
    limit? = 10;

    @IsOptional()
    @IsString()
    cursor?: string;
}