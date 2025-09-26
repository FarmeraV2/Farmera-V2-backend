import { Module } from '@nestjs/common';
import { CategoryController } from './category/category.controller';
import { CategoryService } from './category/category.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Subcategory } from './entities/sub-category.entity';
import { ProductController } from './product/product.controller';
import { ProductService } from './product/product.service';
import { ConfigModule } from '@nestjs/config';
import { Product } from './entities/product.entity';
import { FarmModule } from '../farm/farm.module';

@Module({
    imports: [TypeOrmModule.forFeature([Category, Subcategory, Product]), ConfigModule, FarmModule],
    controllers: [CategoryController, ProductController],
    providers: [CategoryService, ProductService],
})
export class ProductModule {}
