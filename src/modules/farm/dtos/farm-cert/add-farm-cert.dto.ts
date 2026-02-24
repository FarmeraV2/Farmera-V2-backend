import { Type } from "class-transformer";
import { ArrayNotEmpty, IsArray, ValidateNested } from "class-validator";
import { FarmCertificateDto } from "./farm-certificate.dto";

export class AddCertsDto {
    @IsArray()
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => FarmCertificateDto)
    certificates: FarmCertificateDto[];
}