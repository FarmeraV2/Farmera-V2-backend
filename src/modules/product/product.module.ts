import { Module } from '@nestjs/common';
import { CategoryController } from './category/category.controller';
import { CategoryService } from './category/category.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Subcategory } from './entities/sub-category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Category, Subcategory])
  ],
  controllers: [CategoryController],
  providers: [CategoryService]
})
export class ProductModule { }
