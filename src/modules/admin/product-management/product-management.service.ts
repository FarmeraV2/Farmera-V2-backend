import { Injectable, Logger } from '@nestjs/common';
import { ProductService } from 'src/modules/product/product/product.service';

@Injectable()
export class ProductManagementService {

    private readonly logger = new Logger(ProductManagementService.name);

    constructor(private readonly ProductService: ProductService) { }
}
