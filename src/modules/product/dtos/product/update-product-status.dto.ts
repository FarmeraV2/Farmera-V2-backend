import { IsIn } from "class-validator";
import { ProductStatus } from "../../enums/product-status.enum";

export class UpdateProductStatusDto {
    @IsIn([ProductStatus.CLOSED, ProductStatus.OPEN_FOR_SALE], {
    })
    status: ProductStatus;
}