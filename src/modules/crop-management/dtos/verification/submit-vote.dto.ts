import { IsString, IsNotEmpty } from 'class-validator';

export class SubmitVoteDto {
    @IsString()
    @IsNotEmpty()
    transaction_hash: string;
}
