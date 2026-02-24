import { IsOptional } from "class-validator";
import { CertificateStatus } from "../../enums/certificate-status.enum";
import { ParseEnumArray } from "src/common/decorators/parse-enum-array";

export class GetCertDto {
    @IsOptional()
    @ParseEnumArray(CertificateStatus)
    status: CertificateStatus[];
}