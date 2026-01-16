import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { CertificateType } from '../../enums/certificate-type.enum';
import { Expose } from 'class-transformer';

export class FarmCertificateDto {
    @IsEnum(CertificateType)
    @Expose()
    type: CertificateType

    @IsString()
    @IsNotEmpty()
    @Expose()
    url: string;

    @IsObject()
    @IsOptional()
    @Expose()
    meta_data?: Record<string, any>;
}