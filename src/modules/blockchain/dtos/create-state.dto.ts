import { Type } from "class-transformer";
import { IsNotEmpty, IsString, Length } from "class-validator";

export class CreateStateDto {
    @IsString()
    @IsNotEmpty()
    @Length(5)
    key: string;

    @IsString()
    @IsNotEmpty()
    @Type(() => BigInt)
    latest_block_processed: bigint;
}