import { IsBoolean, IsString, IsNotEmpty } from 'class-validator';

export class SubmitVoteDto {
    @IsBoolean()
    is_valid: boolean;

    @IsString()
    @IsNotEmpty()
    transaction_hash: string;
}
