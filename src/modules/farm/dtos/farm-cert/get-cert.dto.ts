import { IsOptional } from "class-validator";
import { CertificateStatus } from "../../enums/certificate-status.enum";
import { ParseEnumArray } from "src/common/decorators/parse-enum-array";
import { PaginationOptions } from "src/common/dtos/pagination/pagination-option.dto";

export class GetCertDto extends PaginationOptions {
    sort_by: string;

    @IsOptional()
    @ParseEnumArray(CertificateStatus)
    status: CertificateStatus[];
}