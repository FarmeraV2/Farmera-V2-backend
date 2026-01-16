// import { Type } from "class-transformer";
// import { IsBoolean, IsLatitude, IsLongitude, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";
// import { PaginationOptions } from "src/common/dtos/pagination/pagination-option.dto";

// export class SearchFarmDto extends PaginationOptions {
//     @IsOptional()
//     @IsString()
//     query?: string;

//     @IsBoolean()
//     @IsOptional()
//     @Type(() => Boolean)
//     approve_only?: boolean;

//     @IsOptional()
//     @IsLatitude()
//     @Type(() => Number)
//     latitude?: number;

//     @IsOptional()
//     @IsLongitude()
//     @Type(() => Number)
//     longitude?: number;

//     @IsOptional()
//     @IsNumber()
//     @IsPositive()
//     @Type(() => Number)
//     radius_km?: number;
// }
