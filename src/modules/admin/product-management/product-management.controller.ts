import { Controller } from '@nestjs/common';
import { ProductManagementService } from './product-management.service';

@Controller('product-management')
export class ProductManagementController {

    constructor(private readonly productManagementService: ProductManagementService) { }


}
