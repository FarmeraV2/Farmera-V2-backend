import { Type } from "class-transformer";
import { IsNotEmpty, IsNumber, IsPositive, IsString } from "class-validator";
import { ParseNumberArray } from "src/common/decorators/parse-number-array";
import { VerificationIdentifier } from "src/modules/crop-management/enums/verification-identifier.enum"

export class IdentifierDto {
    @IsString()
    @IsNotEmpty()
    identifier: VerificationIdentifier;

    @IsNumber()
    @IsPositive()
    @Type(() => Number)
    id: number;
}

export class MultiIdIdentifierDto {
    @IsString()
    @IsNotEmpty()
    identifier: VerificationIdentifier;

    @ParseNumberArray()
    ids: number[];
}