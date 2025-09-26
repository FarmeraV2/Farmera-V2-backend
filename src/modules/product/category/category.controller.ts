import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { CategoryService } from './category.service';
import { UserRole } from 'src/common/enums/role.enum';
import { Roles } from 'src/common/decorators/role.decorator';
import { CreateCategoryDto } from '../dtos/category/create-category.dto';
import { CreateSubcategoryDto } from '../dtos/category/create-sub-category.dto';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('category')
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) { }

    @Roles([UserRole.ADMIN])
    @Post()
    async createCategory(@Body() newCategory: CreateCategoryDto) {
        return await this.categoryService.createCategory(newCategory);
    }

    // @Roles([UserRole.ADMIN])
    @Post("subcategory")
    async createSubCategory(@Body() newSubCategory: CreateSubcategoryDto) {
        return await this.categoryService.createSubcategory(newSubCategory);
    }

    // @Public()
    // @Get("with-subs/:id")
    // async getCategoryTree(@Param("id", ParseIntPipe) id: number) {
    //     return await this.categoryService.getCategoryTree(id);
    // }

    // @Public()
    // @Get("search")
    // async seachCategory(@Query() searchDto: SearchCategoryDto) {
    //     return await this.categoryService.searchCategory(searchDto);
    // }

    @Public()
    @Get("/subcategory/:id")
    async getSubcategory(@Param("id", ParseIntPipe) id: number, @Query("include_category") include?: boolean) {
        return await this.categoryService.getSubcategoryById(id, include);
    }

    @Public()
    @Get(":id")
    async getCategory(@Param("id", ParseIntPipe) id: number, @Query("include_subcategory") include?: boolean) {
        return await this.categoryService.getCategoryById(id, include);
    }

    // @Public()
    // @Get('all')
    // async getCategories(@Query() paginationDto: PaginationOptions) {
    //     return await this.categoryService.getAllCategories(paginationDto);
    // }
}
