import { PaginationOptions } from "src/common/dtos/pagination/pagination-option.dto";
import { VerificationStatus } from "../../enums/verification-status.enum";
import { IsEnum, IsOptional } from "class-validator";

export class GetVerificationDto extends PaginationOptions {
    sort_by: string;

    @IsOptional()
    @IsEnum(VerificationStatus)
    status: VerificationStatus = VerificationStatus.PENDING
}