import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from "typeorm";
import { Category } from '../entities/category.entity';
import { Subcategory } from '../entities/sub-category.entity';
import { CreateCategoryDto } from '../dtos/category/create-category.dto';
import { CreateSubcategoryDto } from '../dtos/category/create-sub-category.dto';

@Injectable()
export class CategoryService {
    private readonly logger = new Logger(CategoryService.name);

    constructor(
        @InjectRepository(Category)
        private readonly categoriesRepository: Repository<Category>,
        @InjectRepository(Subcategory)
        private readonly subcategoriesRepository: Repository<Subcategory>,
    ) { }

    /**
     * @function createCategory - Creates a new category
     * @param {CreateCategoryDto} createCategoryDto - Data required to create the category
     * 
     * @returns {Promise<Category>} - The newly created category entity
     *
     * @throws {InternalServerErrorException} - Thrown if an unexpected error occurs
     * during the creation process.
     */
    async createCategory(createCategoryDto: CreateCategoryDto): Promise<Category> {
        try {
            const category = this.categoriesRepository.create(createCategoryDto);
            return this.categoriesRepository.save(category);
        } catch (error) {
            this.logger.error(error.message);
            throw new InternalServerErrorException(`Failed to create category`);
        }
    }

    /**
     * @function createSubcategory - Creates a new subcategory under an existing category
     * @param {CreateSubcategoryDto} createSub - DTO containing the subcategory details and parent category ID
     *
     * @returns {Promise<Subcategory>} - Returns the newly created subcategory entity
     *
     * @throws {NotFoundException} - If the parent category with the given ID does not exist
     * @throws {InternalServerErrorException} - If the subcategory creation fails unexpectedly
     */
    async createSubcategory(createSub: CreateSubcategoryDto): Promise<Subcategory> {
        try {
            const existingSubcategory = await this.categoriesRepository.findOne({ where: { category_id: createSub.category_id } });
            if (!existingSubcategory) {
                throw new NotFoundException(`Category ${createSub.category_id} not found`);
            }
            const subcategory = this.subcategoriesRepository.create({
                ...createSub,
                category: existingSubcategory,
            });
            return this.subcategoriesRepository.save(subcategory);
        }
        catch (error) {
            this.logger.error(error.message);
            if (error instanceof NotFoundException) throw error;
            throw new InternalServerErrorException("Failed to crate sub category");
        }
    }

    /**
     * @function getCategoryById - Retrieves a category by its ID, with optional subcategories included
     * @param {number} categoryId - The unique identifier of the category
     * @param {boolean} [include_subs] - Optional flag to include related subcategories
     *
     * @returns {Promise<Category>} - Returns the category entity, optionally including its subcategories
     *
     * @throws {NotFoundException} - If no category is found with the given ID
     * @throws {InternalServerErrorException} - If an unexpected error occurs while retrieving the category
     */
    async getCategoryById(categoryId: number, include_subs?: boolean): Promise<Category> {
        try {
            const category = await this.categoriesRepository.findOne({
                where: { category_id: categoryId },
                relations: include_subs ? ["subcategories"] : undefined
            });
            if (!category) {
                throw new NotFoundException(`Category with ID ${categoryId} not found`);
            }
            return category;
        }
        catch (error) {
            this.logger.error(error.message);
            if (error instanceof NotFoundException) throw error;
            throw new InternalServerErrorException(`Failed to get category with ID ${categoryId}`)
        }
    }

    /**
     * @function getSubcategoryById - Retrieves a subcategory by its ID, with optional parent category information
     * @param {number} id - The unique identifier of the subcategory
     * @param {boolean} [includeCategory] - Optional flag to include the related category data
     *
     * @returns {Promise<Subcategory>} - Returns the subcategory entity, optionally including its related category
     *
     * @throws {NotFoundException} - If no subcategory is found with the given ID
     * @throws {InternalServerErrorException} - If an unexpected error occurs while retrieving the subcategory
     */
    async getSubcategoryById(id: number, includeCategory?: boolean): Promise<Subcategory> {
        try {
            const subcategory = await this.subcategoriesRepository.findOne({
                where: { subcategory_id: id },
                relations: includeCategory ? ['category'] : undefined, // Lấy thông tin category liên quan
            });
            if (!subcategory) {
                throw new NotFoundException(`Subcategory with ID ${id} not found`);
            }
            return subcategory;
        }
        catch (error) {
            this.logger.error(error.message);
            if (error instanceof NotFoundException) throw error;
            throw new InternalServerErrorException(`Failed to get subcategory with ID ${id}`)
        }
    }

    // async getCategoriesWithSubcategories(
    //     paginationOptions?: PaginationOptions,
    // ): Promise<PaginationResult<Category>> {
    //     // If no pagination options provided, return all categories (for backward compatibility)
    //     if (!paginationOptions) {
    //         const categories = await this.categoriesRepository.find(
    //             {
    //                 relations: ['subcategories'],
    //                 order: { created: 'DESC' },
    //             }
    //         );
    //         if (!categories || categories.length === 0) {
    //             this.logger.error('Không tìm thấy danh mục nào.');
    //             throw new NotFoundException('Không tìm thấy danh mục nào.');
    //         }
    //         return new PaginationResult(categories);
    //     }


    //     // Use pagination
    //     const queryBuilder = this.categoriesRepository
    //         .createQueryBuilder('category')
    //         .leftJoinAndSelect('category.subcategories', 'subcategories')

    //     // Add sorting if specified
    //     if (paginationOptions.sort_by) {
    //         const validSortValue = ["created", "name"];
    //         if (!validSortValue.includes(paginationOptions.sort_by)) {
    //             throw new BadRequestException("Cột sắp xếp không hợp lệ.")
    //         }

    //         const order = (paginationOptions.order || 'ASC') as 'ASC' | 'DESC';
    //         switch (paginationOptions.sort_by) {
    //             case 'name':
    //                 queryBuilder.orderBy('category.name', order);
    //                 break;
    //             case 'created':
    //                 queryBuilder.orderBy('category.category_id', order);
    //                 break;
    //             default:
    //                 queryBuilder.orderBy('category.category_id', 'DESC');
    //         }
    //     }
    //     else {
    //         queryBuilder.orderBy(
    //             'category.category_id',
    //             (paginationOptions.order || 'DESC') as 'ASC' | 'DESC',
    //         );
    //     }

    //     // If all=true, return all results without pagination
    //     if (paginationOptions.all) {
    //         const categories = await queryBuilder.getMany();
    //         return new PaginationResult(categories);
    //     }

    //     // Apply pagination
    //     const totalItems = await queryBuilder.getCount();

    //     const totalPages = Math.ceil(totalItems / (paginationOptions.limit ?? 10));
    //     const currentPage = paginationOptions.page ?? 1;

    //     if (totalPages > 0 && currentPage > totalPages) {
    //         throw new NotFoundException(`Không tìm thấy dữ liệu ở trang ${currentPage}.`);
    //     }

    //     const categories = await queryBuilder
    //         .skip(paginationOptions.skip)
    //         .take(paginationOptions.limit)
    //         .getMany();

    //     const meta = new PaginationMeta({
    //         paginationOptions,
    //         totalItems,
    //     });

    //     return new PaginationResult(categories, meta);
    // }

    // async searchCategory(searchDto: SearchCategoryDto): Promise<PaginationResult<Category>> {
    //     const paginationOptions = plainToInstance(PaginationOptions, searchDto);

    //     const queryBuilder = this.categoriesRepository
    //         .createQueryBuilder('category')
    //         .leftJoinAndSelect('category.subcategories', 'subcategories')
    //         .where('category.name ILIKE :search', { search: `%${searchDto.query.trim()}%` })

    //     // Add sorting if specified
    //     if (paginationOptions.sort_by) {
    //         const validSortValue = ["created", "name"];
    //         if (!validSortValue.includes(paginationOptions.sort_by)) {
    //             throw new BadRequestException("Cột sắp xếp không hợp lệ.")
    //         }

    //         const order = (paginationOptions.order || 'ASC') as 'ASC' | 'DESC';
    //         switch (paginationOptions.sort_by) {
    //             case 'name':
    //                 queryBuilder.orderBy('category.name', order);
    //                 break;
    //             case 'created':
    //                 queryBuilder.orderBy('category.category_id', order);
    //                 break;
    //             default:
    //                 queryBuilder.orderBy('category.category_id', 'DESC');
    //         }
    //     }
    //     else {
    //         queryBuilder.orderBy(
    //             'category.category_id',
    //             (paginationOptions.order || 'DESC') as 'ASC' | 'DESC',
    //         );
    //     }

    //     // If all=true, return all results without pagination
    //     if (paginationOptions.all) {
    //         const categories = await queryBuilder.getMany();
    //         return new PaginationResult(categories);
    //     }

    //     // Apply pagination
    //     const totalItems = await queryBuilder.getCount();

    //     const totalPages = Math.ceil(totalItems / (paginationOptions.limit ?? 10));
    //     const currentPage = paginationOptions.page ?? 1;

    //     if (totalPages > 0 && currentPage > totalPages) {
    //         throw new NotFoundException(`Không tìm thấy dữ liệu ở trang ${currentPage}.`);
    //     }

    //     const categories = await queryBuilder
    //         .skip(paginationOptions.skip)
    //         .take(paginationOptions.limit)
    //         .getMany();

    //     const meta = new PaginationMeta({
    //         paginationOptions,
    //         totalItems,
    //     });

    //     return new PaginationResult(categories, meta);
    // }


    // // verified
    // async getSubCategoryTree(category_id: number): Promise<Category> {
    //     const category = await this.categoriesRepository.findOne({ where: { category_id: category_id } });
    //     if (!category) {
    //         throw new NotFoundException(`Không tìm thất danh mục với ID ${category_id}`);
    //     }
    //     const subcategories = await this.subcategoriesRepository.find({
    //         where: {
    //             category: { category_id: category_id }
    //         },
    //         order: {
    //             subcategory_id: "ASC"
    //         }
    //     });

    //     category.subcategories = subcategories;

    //     return category;
    // }
}
