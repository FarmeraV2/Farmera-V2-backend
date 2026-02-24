import { ApprovalAction } from '../../enums/approval-action.enum';
import { ArrayNotEmpty, IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateApprovalDto {
    @IsEnum(ApprovalAction)
    action: ApprovalAction;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    reason?: string;

    // @IsArray()
    // @ArrayNotEmpty()
    // @IsNumber({}, { each: true })
    // @Type(() => Number)
    // certificate_ids: number[];

    @IsNumber()
    @Type(() => Number)
    farm_id: number;
}