import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ProductService } from './product.service';
import { User } from 'src/common/decorators/user.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { UserInterface } from 'src/common/types/user.interface';
import { CreateProductDto } from '../dtos/product/create-product.dto';
import { Roles } from 'src/common/decorators/role.decorator';
import { UserRole } from 'src/common/enums/role.enum';
import { GetProductByFarmDto } from '../dtos/product/get-by-farm.dto';
import { SearchProductsDto } from '../dtos/product/search-product.dto';
import { UpdateProductDto } from '../dtos/product/update-product-dto';

@Controller('product')
export class ProductController {
    constructor(private readonly productService: ProductService) {}

    @Post()
    @Roles([UserRole.FARMER])
    async createProduct(@User() user: UserInterface, @Body() createProductDto: CreateProductDto) {
        return await this.productService.createProduct(user.farm_id!, createProductDto);
    }

    @Put(':product_id')
    @Roles([UserRole.FARMER])
    async updateProduct(@Param('product_id') productId: number, @Body() updateProductDto: UpdateProductDto) {
        return await this.productService.updateProduct(productId, updateProductDto);
    }

    // @Patch('status/:product_id')
    // async updateProductStatus(@User() user: UserInterface, @Param('product_id', ParseIntPipe) productId: number, @Body() status: UpdateProductStatusDto) {
    //     return await this.productService.updateProductStatus(user.id, productId, status.status);
    // }

    // @Post('open-for-sale/:product_id')
    // async openProductForSale(@User() user: UserInterface, @Param('product_id', ParseIntPipe) productId: number,) {
    //     return await this.productService.openProductForSale(user.id, productId);
    // }

    @Delete(':product_id')
    @Roles([UserRole.FARMER])
    async deleteProduct(@Param('product_id') productId: number) {
        return await this.productService.deleteProduct(productId);
    }

    @Public()
    async searchAndFilterProducts(@Query() searchProductsDTo: SearchProductsDto) {
        return await this.productService.searchAndFilterProducts(searchProductsDTo);
    }

    @Public()
    @Get('farm/:farm_id')
    async getProductsByFarm(@Param('farm_id') farmId: string, @Query() getProductByFarmDto?: GetProductByFarmDto) {
        return await this.productService.getProductsByFarmId(farmId, getProductByFarmDto);
    }

    @Public()
    @Get('category/sub/:subcategory_id')
    async getProductsBySubCategory(@Param('subcategory_id') subcategory_id: number, @Query() getProductByFarmDto?: GetProductByFarmDto) {
        return await this.productService.getProductsByCategory(subcategory_id, false, getProductByFarmDto);
    }

    @Public()
    @Get('category/:category_id')
    async getProductsByCategory(@Param('category_id') categoryId: number, @Query() getProductByFarmDto?: GetProductByFarmDto) {
        return await this.productService.getProductsByCategory(categoryId, true, getProductByFarmDto);
    }

    @Public()
    @Get(':product_id')
    async getProduct(@Param('product_id') productId: number, @Query('include_categories') include_categories?: boolean) {
        return await this.productService.getProductById(productId, include_categories);
    }

    /*#########################################################################
                                   Deprecated                                
    #########################################################################*/

    // @Public()
    // @Get(':product_id/qr')
    // async getQRCode(@Param('product_id', ParseIntPipe) productId: number) {
    //     return await this.productService.getQRCode(productId);
    // }

    // @Public()
    // @Get(':product_id/traceability')
    // async getTraceabilityData(
    //     @Param('product_id', ParseIntPipe) productId: number,
    // ) {
    //     const traceabilityData =
    //         await this.productService.getTraceabilityData(productId);
    //     return {
    //         data: traceabilityData,
    //         message: 'Traceability data retrieved successfully',
    //     };
    // }

    // @Public()
    // @Get(':product_id/verify-traceability')
    // async verifyTraceability(@Param('product_id', ParseIntPipe) productId: number) {
    //     return await this.productService.verifyTraceability(productId);
    // }

    // @Post(':product_id/activate-blockchain')
    // async activateBlockchain(@User() user: UserInterface, @Param('product_id', ParseIntPipe) productId: number) {
    //     return await this.productService.activateBlockchain(productId, user.id);
    // }

    // @Post(':product_id/generate-qr')
    // async generateQRCode(@User() user: UserInterface, @Param('product_id', ParseIntPipe) productId: number) {
    //     return await this.productService.generateQRCode(productId, user.id);
    // }
}
