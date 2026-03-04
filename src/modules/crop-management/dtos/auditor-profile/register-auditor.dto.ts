import { IsEthereumAddress, IsNumber, IsPositive } from 'class-validator';

export class RegisterAuditorDto {
    @IsNumber()
    @IsPositive()
    user_id: number;

    @IsEthereumAddress()
    wallet_address: string;
}
