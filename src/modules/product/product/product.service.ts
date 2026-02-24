import {
    BadRequestException,
    ForbiddenException,
    HttpException,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Not, Repository, SelectQueryBuilder } from 'typeorm';
import { Product } from '../entities/product.entity';
import { CreateProductDto } from '../dtos/product/create-product.dto';
import { ConfigService } from '@nestjs/config';
import { CategoryService } from '../category/category.service';
import { plainToInstance } from 'class-transformer';
import { PaginationOptions, PaginationTransform } from 'src/common/dtos/pagination/pagination-option.dto';
import { ProductStatus } from '../enums/product-status.enum';
import { PaginationResult } from 'src/common/dtos/pagination/pagination-result.dto';
import { PaginationMeta } from 'src/common/dtos/pagination/pagination-meta.dto';
import { ProductSortField } from '../enums/product-sort-fields.enum';
import { ProductDto, productSelectFields } from '../dtos/product/product.dto';
import { subcategorySelectFields } from '../dtos/category/subcategory.dto';
import { SearchProductsDto } from '../dtos/product/search-product.dto';
import { UpdateProductDto } from '../dtos/product/update-product-dto';
import { ResponseCode } from 'src/common/constants/response-code.const';
import { applyPagination } from 'src/common/utils/pagination.util';
import { farmSummaryDtoSelectFields } from 'src/modules/farm/dtos/farm/farm.dto';
import { ProductDetailDto, productDetailSelectFields } from '../dtos/product/product-detail.dto';
import { FarmProductDetailDto, farmProductDetailSelectFields } from '../dtos/product/farm-product-detail.dto';
import { FarmProductDto, farmProductSelectFields } from '../dtos/product/farm-product.dto';

@Injectable()
export class ProductService {
    private readonly logger = new Logger(ProductService.name);

    private appUrl: string; // use for generating QR code deep link

    constructor(
        @InjectRepository(Product) private readonly productsRepository: Repository<Product>,
        // @InjectRepository(Process)
        // private readonly processRepository: Repository<Process>,
        // @InjectRepository(ProductProcessAssignment)
        // private readonly assignmentRepository: Repository<ProductProcessAssignment>,
        // private readonly fileStorageService: AzureBlobService,
        private readonly categoryService: CategoryService,
        private readonly configService: ConfigService,
        // @InjectDataSource()
        private readonly dataSource: DataSource,
        // private readonly blockchainService: BlockchainService,
    ) {
        const appUrl = this.configService.get<string>('APP_URL');
        if (!appUrl) {
            this.logger.warn('APP_URL environment variable is not defined');
            return;
        }
        this.appUrl = appUrl;
    }

    /**
     * @function createProduct - Creates and saves a new product for a given farm
     * @param {number} farmId - The ID of the farm to which the product belongs
     * @param {CreateProductDto} createProductDto - DTO containing product details and optional subcategory IDs
     *
     * @returns {Promise<Product>} - Returns the newly created product entity
     *
     * @throws {BadRequestException} - If provided subcategory IDs are invalid
     * @throws {InternalServerErrorException} - If the product creation or saving process fails due to an unexpected error
     */
    async createProduct(farmId: number, createProductDto: CreateProductDto): Promise<ProductDetailDto> {
        try {
            const { subcategory_ids, ...temp_product } = createProductDto;

            const product = this.productsRepository.create(temp_product);
            if (!product.thumbnail && product.image_urls && product.image_urls.length > 0) {
                product.thumbnail = product.image_urls[0];
            }
            product.farm_id = farmId;
            product.low_stock_threshold = Math.floor(product.stock_quantity * 10 / 100);

            if (subcategory_ids && subcategory_ids.length > 0) {
                const subcategories = await this.categoryService.getSubcategoryByIds(subcategory_ids, false);
                if (subcategories.length !== subcategory_ids.length) {
                    throw new BadRequestException({
                        message: 'Invalid subcategory ids',
                        code: ResponseCode.INVALID_ID
                    });
                }
                product.subcategories = subcategories;
            }

            const result = await this.productsRepository.save(product);
            return plainToInstance(ProductDetailDto, result, { excludeExtraneousValues: true });
        } catch (error) {
            if (error instanceof HttpException) throw error;
            this.logger.error(error.message);
            throw new InternalServerErrorException({
                message: `Failed to create product`,
                code: ResponseCode.FAILED_TO_CREATE_PRODUCT,
            });
        }
    }

    /**
     * @function deleteProduct - Soft deletes a product by updating its status to DELETED
     * @param {number} productId - The ID of the product to be deleted
     *
     * @returns {Promise<boolean>} - Returns true if the product was successfully marked as deleted, otherwise false
     *
     * @throws {InternalServerErrorException} - If the deletion process fails due to an unexpected error
     */
    async deleteProduct(productId: number): Promise<boolean> {
        const validStatusToDelete = [ProductStatus.NOT_YET_OPEN, ProductStatus.SOLD_OUT];
        try {
            const product = await this.productsRepository.findOne({
                where: { product_id: productId },
                select: ["status"]
            })
            if (!product) throw new NotFoundException({
                message: "Product not found",
                code: ResponseCode.PRODUCT_NOT_FOUND
            })
            if (!validStatusToDelete.includes(product.status)) throw new BadRequestException({
                message: "Invalid product to delete",
                code: ResponseCode.INVALID_PRODUCT_TO_DELETE
            })
            const deleteResult = await this.productsRepository.update({ product_id: productId }, { status: ProductStatus.DELETED });
            if (deleteResult.affected === 0) {
                return false;
            }
            return true;
        } catch (error) {
            if (error instanceof HttpException) throw error;
            this.logger.error(error.message);
            throw new InternalServerErrorException({
                message: 'Failed to delete product',
                code: ResponseCode.FAILED_TO_DELETE_PRODUCT,
            });
        }
    }

    async updateProduct(productId: number, updateProductDto: UpdateProductDto): Promise<Product> {
        try {
            const product = await this.productsRepository.findOne({
                where: { product_id: productId },
            });

            if (!product) {
                throw new NotFoundException({
                    message: `Product ${productId} not found`,
                    code: ResponseCode.PRODUCT_NOT_FOUND,
                });
            }
            if (product.status !== ProductStatus.NOT_YET_OPEN && product.status !== ProductStatus.PRE_ORDER) {
                throw new ForbiddenException({
                    message: 'Cannot update the product in its current status',
                    code: ResponseCode.FAILED_TO_UPDATE_PRODUCT
                });
            }

            // const deleteImgUrls = product.image_urls?.filter((value) => !updateProductDto.image_urls?.includes(value));
            // const deleteVideoUrls = product.video_urls?.filter((value) => !updateProductDto.video_urls?.includes(value));

            // const failedDeletes: string[] = [];
            // todo!("external storage");
            // // delete images
            // if (deleteImgUrls?.length) {
            //     const imgResults = await Promise.allSettled(
            //         deleteImgUrls.map((url) => this.fileStorageService.deleteFile(url)),
            //     );

            //     imgResults.forEach((result, index) => {
            //         if (result.status === 'rejected') {
            //             this.logger.error(
            //                 `Failed to delete image: ${deleteImgUrls[index]}`,
            //             );
            //             failedDeletes.push(deleteImgUrls[index]);
            //         }
            //     });
            // }

            // // delete videos
            // if (deleteVideoUrls?.length) {
            //     const videoResults = await Promise.allSettled(
            //         deleteVideoUrls.map((url) => this.fileStorageService.deleteFile(url)),
            //     );

            //     videoResults.forEach((result, index) => {
            //         if (result.status === 'rejected') {
            //             this.logger.error(
            //                 `Failed to delete video: ${deleteVideoUrls[index]}`,
            //             );
            //             failedDeletes.push(deleteVideoUrls[index]);
            //         }
            //     });
            // }

            const updateProduct = { ...product, ...updateProductDto };

            updateProduct.image_urls = updateProductDto.image_urls ? updateProductDto.image_urls : null;
            updateProduct.video_urls = updateProductDto.video_urls ? updateProductDto.video_urls : null;

            return await this.productsRepository.save(updateProduct);
        } catch (err) {
            if (err instanceof HttpException) throw err;
            this.logger.error(err.message);
            throw new InternalServerErrorException({
                message: 'Failed to update product',
                code: ResponseCode.FAILED_TO_UPDATE_PRODUCT,
            });
        }
    }

    /**
     * @function searchAndFilterProducts - Searches and filters products based on various criteria
     * @param {SearchProductsDto} searchProductsDTo - DTO containing search, filter, sorting, and pagination parameters
     *
     * @returns {Promise<PaginationResult<ProductDto>>} - Returns a paginated list of products as DTOs,
     * or all products if the `all` flag is set
     *
     * @throws {BadRequestException} - If an invalid status is provided or the requested page is out of range
     * @throws {InternalServerErrorException} - If the search and filtering process fails due to an unexpected error
     */
    async searchAndFilterProducts(searchProductsDto: SearchProductsDto, farmId?: number): Promise<PaginationResult<ProductDto>> {
        // todo!("optimize this fk shit")
        // extract pagination options
        const paginationOptions = plainToInstance(PaginationTransform<ProductSortField>, searchProductsDto);
        try {
            const queryBuilder = this.productsRepository.createQueryBuilder('product').select(productSelectFields)
            if (farmId) {
                queryBuilder.where('product.farm_id = :farmId', { farmId: farmId });
            }
            // todo!("only get available products")
            // .where('product.status != :deletedStatus', { deletedStatus: ProductStatus.DELETED });

            // apply filter
            this.applyFilter(queryBuilder, searchProductsDto);
            // apply sorting
            this.applySorting(queryBuilder, paginationOptions);
            // apply pagination
            const totalItems = await applyPagination(queryBuilder, paginationOptions);

            // get result
            const products = await queryBuilder.getMany();
            const meta = new PaginationMeta({
                paginationOptions,
                totalItems,
            });
            return new PaginationResult(plainToInstance(ProductDto, products), meta);
        } catch (err) {
            if (err instanceof HttpException) throw err;
            this.logger.error(err.message);
            throw new InternalServerErrorException({
                message: 'Failed to get products',
                code: ResponseCode.FAILED_TO_GET_PRODUCT
            });
        }
    }

    /**
     * @function getProductById - Retrieves a product by its unique ID
     * @param {number} productId - The ID of the product to retrieve
     * @param {boolean} [includeCategories] - Whether to include the product's subcategories in the result
     *
     * @returns {Promise<Product>} - Returns the product entity, optionally including its subcategories
     *
     * @throws {NotFoundException} - If no active (non-deleted) product is found with the given ID
     * @throws {InternalServerErrorException} - If the retrieval process fails due to an unexpected error
     */
    async getProductById(productId: number, includeCategories?: boolean): Promise<ProductDetailDto> {
        try {
            const queryBuilder = this.productsRepository.createQueryBuilder('product').select(productDetailSelectFields)
                .where('product.product_id = :productId', { productId })
                .leftJoin('product.farm', 'farm').addSelect(farmSummaryDtoSelectFields);

            if (includeCategories)
                queryBuilder.leftJoin('product.subcategories', 'subcategory').addSelect(subcategorySelectFields);

            const product = await queryBuilder.getOne();

            if (!product) {
                throw new InternalServerErrorException({
                    message: 'Product not found',
                    code: ResponseCode.PRODUCT_NOT_FOUND,
                });
            }
            return plainToInstance(ProductDetailDto, product, { excludeExtraneousValues: true });
        } catch (err) {
            if (err instanceof HttpException) throw err;
            this.logger.error(err.message);
            throw new InternalServerErrorException({
                message: `Failed to get product ${productId}`,
                code: ResponseCode.FAILED_TO_GET_PRODUCT,
            });
        }
    }

    async findOneById(productId: number): Promise<Product> {
        try {
            const product = await this.productsRepository.createQueryBuilder('product')
                .where("product.product_id = :id", { id: productId })
                .getOne();
            if (!product) {
                throw new InternalServerErrorException({
                    message: 'Product not found',
                    code: ResponseCode.PRODUCT_NOT_FOUND,
                });
            }
            return product;
        } catch (err) {
            if (err instanceof HttpException) throw err;
            this.logger.error(err.message);
            throw new InternalServerErrorException({
                message: `Failed to get product ${productId}`,
                code: ResponseCode.FAILED_TO_GET_PRODUCT,
            });
        }
    }

    // async findProductsByIds(
    //     productIds: number[],
    //     productOptions?: ProductOptions,
    // ): Promise<Product[]> {
    //     try {
    //         const relationsToLoads: string[] = [];
    //         if (productOptions?.include_farm) {
    //             relationsToLoads.push(
    //                 ...['farm', 'farm.address', 'farm.address.address_ghn'],
    //             );
    //         }
    //         if (productOptions?.include_categories)
    //             relationsToLoads.push('subcategories');
    //         if (productOptions?.include_processes) relationsToLoads.push('processes');

    //         this.logger.log(
    //             `(relationsToLoads) Đang tải các quan hệ: ${relationsToLoads.join(', ')}`,
    //         );
    //         const products = await this.productsRepository.find({
    //             where: {
    //                 product_id: In(productIds),
    //                 status: Not(ProductStatus.DELETED),
    //             },
    //             relations: relationsToLoads,
    //         });

    //         if (!products || products.length === 0) {
    //             this.logger.error(
    //                 `(findProductsByIds) Không tìm thấy sản phẩm với ID: ${productIds.join(', ')}`,
    //             );
    //             throw new NotFoundException('Không tìm thấy sản phẩm');
    //         }
    //         this.logger.log(
    //             `(findProductsByIds) Tìm thấy ${products.length} sản phẩm với ID: ${productIds.join(', ')}`,
    //         );
    //         //this.logger.log(`(Products) ${JSON.stringify(products, null, 2)}`);
    //         return products;
    //     } catch (err) {
    //         if (err instanceof NotFoundException) throw err;
    //         this.logger.error(err.message);
    //         throw new InternalServerErrorException('Không thể tìm kiếm sản phẩm');
    //     }
    // }

    /**
     * @function getFarmProducts - Retrieves products belonging to a specific farm by its id
     * @param {number} farmId - The id of the farm
     * @param {SearchProductsDto} [getProductDto] - Optional DTO containing pagination, sorting, and inclusion parameters
     *
     * @returns {Promise<PaginationResult<ProductDto>>} - Returns a paginated list of products with metadata,
     *
     * @throws {BadRequestException} - If the requested page exceeds the total number of available pages
     * @throws {InternalServerErrorException} - If the retrieval process fails due to an unexpected error
     */
    async getFarmProducts(farmId: number, searchProductsDto: SearchProductsDto): Promise<PaginationResult<FarmProductDto>> {
        const paginationOptions = plainToInstance(PaginationTransform<ProductSortField>, searchProductsDto);
        try {
            const qb = this.productsRepository
                .createQueryBuilder('product')
                .select(farmProductSelectFields)
                .where('product.farm_id = :farmId', { farmId })
                .andWhere('product.status != :deletedStatus', {
                    deletedStatus: ProductStatus.DELETED,
                });

            this.applyFilter(qb, searchProductsDto, false);
            this.applySorting(qb, paginationOptions);

            // apply pagination
            const totalItems = await applyPagination(qb, paginationOptions);

            // get result
            const products = await qb.getMany();

            const meta = new PaginationMeta({
                paginationOptions,
                totalItems,
            });
            return new PaginationResult(plainToInstance(FarmProductDto, products, { excludeExtraneousValues: true }), meta);
        } catch (err) {
            if (err instanceof HttpException) throw err;
            this.logger.error(err.message);
            throw new InternalServerErrorException({
                message: 'Failed to get farm products',
                code: ResponseCode.FAILED_TO_GET_PRODUCT
            });
        }
    }

    /**
     * @function getProductsByCategory - Retrieves products filtered by category or subcategory ID
     * @param {number} id - The ID of the category or subcategory
     * @param {boolean} isCategory - Flag to determine whether the ID refers to a category (true) or subcategory (false)
     * @param {GetProductByFarmDto} [getProductDto] - Optional DTO containing pagination, sorting, and inclusion parameters
     *
     * @returns {Promise<PaginationResult<ProductDto>>} - Returns a paginated list of products with metadata,
     * or all products if the `all` flag is set
     *
     * @throws {BadRequestException} - If the requested page exceeds the total number of available pages
     * @throws {InternalServerErrorException} - If the retrieval process fails due to an unexpected error
     */
    // async getProductsByCategory(id: number, isCategory: boolean, getProductDto?: GetProductByFarmDto): Promise<PaginationResult<ProductDto>> {
    //     try {
    //         // extract pagination options
    //         const paginationOptions = plainToInstance(PaginationTransform<ProductSortField>, getProductDto);
    //         const { sort_by, order } = paginationOptions;

    //         const qb = this.productsRepository.createQueryBuilder('product').select(productSelectFields);

    //         if (getProductDto?.include_categories) {
    //             qb.leftJoin('product.subcategories', 'subcategory').addSelect(subcategorySelectFields);
    //         } else {
    //             qb.leftJoin('product.subcategories', 'subcategory');
    //         }

    //         qb.andWhere('product.status != :deletedStatus', {
    //             deletedStatus: ProductStatus.DELETED,
    //         });

    //         if (isCategory) {
    //             qb.leftJoin('subcategory.category', 'category').andWhere('category.category_id = :id', { id });
    //         } else {
    //             qb.andWhere('subcategory.subcategory_id = :id', { id });
    //         }

    //         // apply sorting
    //         if (sort_by || order) this.applySorting(qb, sort_by, order);

    //         // apply pagination
    //         const totalItems = await applyPagination(qb, paginationOptions);

    //         // get result
    //         const products = await qb.getMany();
    //         const meta = new PaginationMeta({
    //             paginationOptions,
    //             totalItems,
    //         });
    //         return new PaginationResult(products, meta);
    //     } catch (err) {
    //         if (err instanceof HttpException) throw err;
    //         this.logger.error(err.message);
    //         throw new InternalServerErrorException({
    //             message: 'Failed to get product by categories',
    //             code: ResponseCode.FAILED_TO_GET_PRODUCT,
    //         });
    //     }
    // }

    async getFarmProductById(productId: number): Promise<FarmProductDetailDto> {
        try {
            const queryBuilder = this.productsRepository.createQueryBuilder('product').select(farmProductDetailSelectFields)
                .where('product.product_id = :productId', { productId })

            const product = await queryBuilder.getOne();

            if (!product) {
                throw new InternalServerErrorException({
                    message: 'Product not found',
                    code: ResponseCode.PRODUCT_NOT_FOUND,
                });
            }
            return plainToInstance(FarmProductDetailDto, product, { excludeExtraneousValues: true });
        } catch (err) {
            if (err instanceof HttpException) throw err;
            this.logger.error(err.message);
            throw new InternalServerErrorException({
                message: `Failed to get product ${productId}`,
                code: ResponseCode.FAILED_TO_GET_PRODUCT,
            });
        }
    }

    async getProductSeasonStatus(productId: number): Promise<Product> {
        try {
            const product = await this.productsRepository.findOne({
                where: { product_id: productId },
                select: ['status', "season_id"],
            });
            if (!product)
                throw new NotFoundException({
                    message: "Product not found",
                    code: ResponseCode.PRODUCT_NOT_FOUND,
                });
            return product;
        } catch (err) {
            if (err instanceof HttpException) throw err;
            this.logger.error(err.message);
            throw new InternalServerErrorException({
                message: `Failed to get product ${productId}`,
                code: ResponseCode.FAILED_TO_GET_PRODUCT,
            });
        }
    }

    async updateProductStatus(productId: number, status: ProductStatus): Promise<void> {
        const result = await this.productsRepository.update(
            { product_id: productId },
            { status: status },
        );
        if (!result.affected || result.affected === 0) {
            throw new Error();
        }
    }

    async getProductRatings(farmId: number): Promise<number[]> {
        try {
            const products = await this.productsRepository.find({
                select: ["average_rating"],
                where: { farm_id: farmId, status: Not(In([ProductStatus.DELETED, ProductStatus.PRE_ORDER])) }
            })
            return products.map((p) => p.average_rating);
        }
        catch (error) {
            throw Error(`Failed to get product rating: ${error.message}`);
        }
    }

    /*#########################################################################
                               Private functions                             
    #########################################################################*/

    /**
     * @function applySorting - Applies sorting conditions to a product query builder
     * @param {SelectQueryBuilder<Product>} qb - The query builder instance for the Product entity
     * @param {PaginationOptions<ProductSortField>} paginationOptions - Pagination options (sort & order)
     */
    private applySorting(qb: SelectQueryBuilder<Product>, paginationOptions: PaginationOptions<ProductSortField>) {
        const { sort_by, order } = paginationOptions;
        switch (sort_by) {
            case ProductSortField.PRODUCT_NAME:
                qb.orderBy('product.product_name', order);
                break;
            case ProductSortField.STATUS:
                qb.orderBy('product.status', order);
                break;
            case ProductSortField.PRICE:
                qb.orderBy('product.price_per_unit', order);
                break;
            case ProductSortField.AVERAGE_RATING:
                qb.orderBy('product.average_rating', order);
                break;
            case ProductSortField.TOTAL_SOLD:
                qb.orderBy('product.total_sold', order);
                break;
            case ProductSortField.CREATED:
                qb.orderBy('product.product_id', order);
                break;
            case ProductSortField.UPDATED:
                qb.orderBy('product.updated', order);
                break;
            default:
                qb.orderBy('product.product_id', order);
        }
    }

    private applyFilter(qb: SelectQueryBuilder<Product>, searchProductsDto: SearchProductsDto, allowedStatusOnly: boolean = true) {
        const { subcategory_ids, is_category, search, min_price, max_price, min_rating, max_rating, min_total_sold, status, include_categories } = searchProductsDto;
        // include category in result
        if (include_categories) {
            qb.leftJoin('product.subcategories', 'subcategory').addSelect(subcategorySelectFields);
        } else {
            qb.leftJoin('product.subcategories', 'subcategory');
        }

        if (subcategory_ids) {
            if (is_category) {
                qb.leftJoin('subcategory.category', 'category').andWhere('category.category_id IN (:...ids)', { ids: subcategory_ids });
            } else {
                qb.andWhere('subcategory.subcategory_id IN (:...ids)', { ids: subcategory_ids });
            }
        }

        if (min_price) {
            qb.andWhere('product.price_per_unit >= :minPrice', { minPrice: min_price });
        }
        if (max_price) {
            qb.andWhere('product.price_per_unit <= :maxPrice', { maxPrice: max_price });
        }
        if (min_rating) {
            qb.andWhere('product.average_rating >= :minRating', { minRating: min_rating });
        }
        if (max_rating) {
            qb.andWhere('product.average_rating <= :maxRating', { maxRating: max_rating });
        }
        if (min_total_sold) {
            qb.andWhere('product.total_sold >= :minTotalSold', { minTotalSold: min_total_sold });
        }
        if (search) {
            // todo!("apply pg full text search")
            qb.andWhere('("product"."product_name" ILIKE :search)', { search: `%${search.trim()}%` });
        }

        if (allowedStatusOnly) {
            const allowedStatuses = [ProductStatus.PRE_ORDER, ProductStatus.NOT_YET_OPEN, ProductStatus.OPEN_FOR_SALE, ProductStatus.SOLD_OUT];
            if (status && status.length > 0) {
                const isValid = status.every(s => allowedStatuses.includes(s));
                if (!isValid)
                    throw new BadRequestException({
                        message: 'Invalid status',
                        code: ResponseCode.INVALID_STATUS
                    });
                qb.andWhere('product.status IN (:...status)', { status: status });
            } else {
                qb.andWhere('product.status IN (:...allowedStatuses)', { allowedStatuses });
            }
        }
        else if (status && status.length > 0) {
            qb.andWhere('product.status IN (:...status)', { status: status });
        }
    }

    // async openProductForSale(userId: string, productId: number): Promise<string> {
    //     try {
    //         // check valid user
    //         if (!(await this.isProductUserValid(userId, productId)))
    //             throw new UnauthorizedException(
    //                 'Người dùng không có quyền thao tác trên sản phẩm',
    //             );

    //         // validate product processes
    //         if (!(await this.validProductProcess(productId)))
    //             throw new BadRequestException(
    //                 'Quy trình sản xuất của sản phẩm không hợp lệ',
    //             );

    //         // generate QR code
    //         const deepLink = `${this.appUrl}/redirect/product/${productId}`;
    //         const qrCode = await QRCode.toDataURL(deepLink);

    //         // update open for sale if the processes is valid
    //         const result = await this.productsRepository.update(
    //             { product_id: productId },
    //             { status: ProductStatus.OPEN_FOR_SALE },
    //         );
    //         if (result.affected === 0) {
    //             throw new NotFoundException(
    //                 `Không tìm thấy sản phẩm ID: ${productId}.`,
    //             );
    //         }
    //         return qrCode;
    //     } catch (err) {
    //         if (
    //             err instanceof UnauthorizedException ||
    //             err instanceof BadRequestException ||
    //             err instanceof NotFoundException
    //         )
    //             throw err;
    //         this.logger.error(err.message);
    //         throw new InternalServerErrorException('Không thể mở bán sản phẩm');
    //     }
    // }

    // private async validProductProcess(productId: number): Promise<boolean> {
    //     const stages = await this.processRepository.find({
    //         where: { product: { product_id: productId } },
    //         select: ['stage_name'],
    //     });
    //     const hasStart = stages.some((p) => p.stage_name === ProcessStage.START);
    //     const hasProduction = stages.some(
    //         (p) => p.stage_name === ProcessStage.PRODUCTION,
    //     );
    //     const hasCompletion = stages.some(
    //         (p) => p.stage_name === ProcessStage.COMPLETION,
    //     );

    //     return hasStart && hasProduction && hasCompletion;
    // }

    // private async isProductUserValid(
    //     userId: string,
    //     productId: number,
    // ): Promise<boolean> {
    //     const validUser = await this.productsRepository.exists({
    //         where: { farm: { user_id: userId }, product_id: productId },
    //     });
    //     if (!validUser) return false;
    //     return true;
    // }

    // async generateQRCode(
    //     productId: number,
    //     userId: string,
    // ): Promise<{ qr_code: string }> {
    //     // Verify product ownership
    //     const isValid = await this.isProductUserValid(userId, productId);
    //     if (!isValid) {
    //         throw new UnauthorizedException(
    //             'Bạn không có quyền tạo QR cho sản phẩm này',
    //         );
    //     }

    //     const product = await this.productsRepository.findOne({
    //         where: { product_id: productId },
    //     });

    //     if (!product) {
    //         throw new NotFoundException('Sản phẩm không tồn tại');
    //     }

    //     try {
    //         // Generate deep link URL for the product using redirect endpoint
    //         const deepLinkUrl = `${this.appUrl}/api/redirect/product/${productId}`;

    //         // Generate QR code as data URL
    //         const qrCodeDataUrl = await QRCode.toDataURL(deepLinkUrl, {
    //             errorCorrectionLevel: 'M',
    //             margin: 1,
    //             color: {
    //                 dark: '#000000',
    //                 light: '#FFFFFF',
    //             },
    //         });

    //         // Update product with QR code
    //         await this.productsRepository.update(productId, {
    //             qr_code: qrCodeDataUrl,
    //         });

    //         return { qr_code: qrCodeDataUrl };
    //     } catch (error) {
    //         this.logger.error(`QR Code generation failed: ${error.message}`);
    //         throw new InternalServerErrorException('Không thể tạo mã QR');
    //     }
    // }

    // async activateBlockchain(
    //     productId: number,
    //     userId: string,
    // ): Promise<{ blockchain_hash: string; success: boolean }> {
    //     // Verify product ownership
    //     const isValid = await this.isProductUserValid(userId, productId);
    //     if (!isValid) {
    //         throw new UnauthorizedException(
    //             'Bạn không có quyền kích hoạt blockchain cho sản phẩm này',
    //         );
    //     }

    //     const product = await this.productsRepository.findOne({
    //         where: { product_id: productId },
    //         relations: ['farm'],
    //     });

    //     if (!product) {
    //         throw new NotFoundException('Sản phẩm không tồn tại');
    //     }

    //     if (product.blockchain_activated) {
    //         throw new BadRequestException('Sản phẩm đã được kích hoạt blockchain');
    //     }

    //     try {
    //         // Get all process assignments for this product
    //         const assignments = await this.assignmentRepository.find({
    //             where: { product: { product_id: productId } },
    //             relations: ['processTemplate', 'processTemplate.steps'],
    //         });

    //         if (!assignments || assignments.length === 0) {
    //             throw new BadRequestException(
    //                 'Sản phẩm chưa có quy trình sản xuất nào được gán',
    //             );
    //         }

    //         // Get all step diary entries for these assignments
    //         const stepDiaries = await this.stepDiaryRepository.find({
    //             where: {
    //                 assignment: {
    //                     assignment_id: In(assignments.map((a) => a.assignment_id)),
    //                 },
    //             },
    //             relations: ['assignment', 'step'],
    //             order: { step_order: 'ASC', recorded_date: 'ASC' },
    //         });

    //         // Validate that all required steps are completed
    //         const incompleteSteps = stepDiaries.filter(
    //             (diary) => diary.completion_status !== 'COMPLETED',
    //         );

    //         if (incompleteSteps.length > 0) {
    //             const incompleteStepNames = incompleteSteps
    //                 .map((d) => d.step_name)
    //                 .join(', ');
    //             throw new BadRequestException(
    //                 `Không thể kích hoạt blockchain: còn ${incompleteSteps.length} bước chưa hoàn thành (${incompleteStepNames})`,
    //             );
    //         }

    //         // Validate that all assignments are completed
    //         const incompleteAssignments = assignments.filter(
    //             (assignment) => assignment.status !== 'COMPLETED',
    //         );

    //         if (incompleteAssignments.length > 0) {
    //             const incompleteProcessNames = incompleteAssignments
    //                 .map((a) => a.processTemplate.process_name)
    //                 .join(', ');
    //             throw new BadRequestException(
    //                 `Không thể kích hoạt blockchain: còn ${incompleteAssignments.length} quy trình chưa hoàn thành (${incompleteProcessNames})`,
    //             );
    //         }

    //         // Create traceability data for blockchain
    //         const traceabilityData: TraceabilityData = {
    //             product,
    //             assignments,
    //             stepDiaries,
    //         };

    //         // Add to blockchain using the new service
    //         const blockchainHash =
    //             await this.blockchainService.addProductWithTraceability(
    //                 traceabilityData,
    //             );

    //         // Update product with blockchain activation
    //         await this.productsRepository.update(productId, {
    //             blockchain_activated: true,
    //             blockchain_hash: blockchainHash,
    //         });

    //         this.logger.log(
    //             `Blockchain activated for product ${productId} with hash: ${blockchainHash}`,
    //         );

    //         return {
    //             blockchain_hash: blockchainHash,
    //             success: true,
    //         };
    //     } catch (error) {
    //         this.logger.error(`Blockchain activation failed: ${error.message}`);
    //         if (
    //             error instanceof BadRequestException ||
    //             error instanceof UnauthorizedException
    //         ) {
    //             throw error;
    //         }
    //         throw new InternalServerErrorException('Không thể kích hoạt blockchain');
    //     }
    // }

    // private generateBlockchainHash(data: any): string {
    //     // Simple hash generation for demo purposes
    //     // In production, this would use proper blockchain integration
    //     const crypto = require('crypto');
    //     const jsonString = JSON.stringify(data);
    //     return crypto.createHash('sha256').update(jsonString).digest('hex');
    // }

    // async getQRCode(productId: number): Promise<{ qr_code: string | null }> {
    //     const product = await this.productsRepository.findOne({
    //         where: { product_id: productId },
    //         select: ['qr_code'],
    //     });

    //     if (!product) {
    //         throw new NotFoundException('Sản phẩm không tồn tại');
    //     }

    //     return { qr_code: product.qr_code || null };
    // }

    // async updateProductQuantity(
    //     productId: number,
    //     request_quantity: number,
    //     operation: UpdateProductQuantityOperation,
    // ): Promise<{ success: boolean; message: string }> {
    //     try {
    //         const product = await this.productsRepository.findOne({
    //             where: { product_id: productId },
    //         });

    //         if (!product) {
    //             return {
    //                 success: false,
    //                 message: 'Sản phẩm không tồn tại',
    //             };
    //         }

    //         if (product.status !== ProductStatus.OPEN_FOR_SALE) {
    //             return {
    //                 success: false,
    //                 message: 'Sản phẩm không thể cập nhật số lượng',
    //             };
    //         }

    //         if (
    //             operation === UpdateProductQuantityOperation.DECREASE &&
    //             product.stock_quantity < request_quantity
    //         ) {
    //             return {
    //                 success: false,
    //                 message: `Số lượng không đủ. Hiện có: ${product.stock_quantity}, yêu cầu: ${request_quantity}`,
    //             };
    //         }

    //         if (operation === UpdateProductQuantityOperation.INCREASE) {
    //             product.stock_quantity += request_quantity;
    //         } else if (operation === UpdateProductQuantityOperation.DECREASE) {
    //             product.stock_quantity -= request_quantity;
    //         } else {
    //             return {
    //                 success: false,
    //                 message: 'Phương thức cập nhật không hợp lệ',
    //             };
    //         }

    //         await this.productsRepository.save(product);

    //         return {
    //             success: true,
    //             message: `Cập nhật số lượng thành công. Số lượng hiện tại: ${product.stock_quantity}`,
    //         };
    //     } catch (error) {
    //         this.logger.error(
    //             `Cập nhật số lượng sản phẩm thất bại: ${error.message}`,
    //         );
    //         return {
    //             success: false,
    //             message: 'Lỗi hệ thống khi cập nhật số lượng sản phẩm',
    //         };
    //     }
    // }
    // async updateProductQuantities(
    //     items: Array<{
    //         product_id: number;
    //         request_quantity: number;
    //         operation: UpdateProductQuantityOperation;
    //     }>,
    // ): Promise<{
    //     success: boolean;
    //     message: string;
    //     results: Array<{
    //         product_id: number;
    //         success: boolean;
    //         message: string;
    //         previous_quantity?: number;
    //         new_quantity?: number;
    //     }>;
    // }> {
    //     if (!items || items.length === 0) {
    //         return {
    //             success: false,
    //             message: 'Danh sách sản phẩm không được rỗng',
    //             results: [],
    //         };
    //     }

    //     if (items.length > 100) {
    //         return {
    //             success: false,
    //             message: 'Tối đa 100 sản phẩm mỗi lần cập nhật',
    //             results: [],
    //         };
    //     }

    //     const queryRunner = this.dataSource.createQueryRunner();
    //     await queryRunner.connect();
    //     await queryRunner.startTransaction();

    //     try {
    //         const results: Array<{
    //             product_id: number;
    //             success: boolean;
    //             message: string;
    //             previous_quantity?: number;
    //             new_quantity?: number;
    //         }> = [];
    //         let successCount = 0;
    //         let failCount = 0;

    //         for (const item of items) {
    //             try {
    //                 if (
    //                     item.product_id === undefined ||
    //                     !item.request_quantity ||
    //                     !item.operation
    //                 ) {
    //                     results.push({
    //                         product_id: item.product_id || 0,
    //                         success: false,
    //                         message:
    //                             'Thiếu thông tin bắt buộc: productId, request_quantity, operation',
    //                     });
    //                     failCount++;
    //                     continue;
    //                 }

    //                 if (item.request_quantity <= 0) {
    //                     results.push({
    //                         product_id: item.product_id,
    //                         success: false,
    //                         message: 'Số lượng yêu cầu phải lớn hơn 0',
    //                     });
    //                     failCount++;
    //                     continue;
    //                 }
    //                 const product = await queryRunner.manager.findOne(Product, {
    //                     where: { product_id: item.product_id },
    //                 });

    //                 if (!product) {
    //                     results.push({
    //                         product_id: item.product_id,
    //                         success: false,
    //                         message: 'Sản phẩm không tồn tại',
    //                     });
    //                     failCount++;
    //                     continue;
    //                 }
    //                 if (
    //                     item.operation === UpdateProductQuantityOperation.DECREASE &&
    //                     product.stock_quantity < item.request_quantity
    //                 ) {
    //                     results.push({
    //                         product_id: item.product_id,
    //                         success: false,
    //                         message: `Số lượng không đủ. Hiện có: ${product.stock_quantity}, yêu cầu: ${item.request_quantity}`,
    //                     });
    //                     failCount++;
    //                     continue;
    //                 }

    //                 const previousQuantity = product.stock_quantity;

    //                 if (item.operation === UpdateProductQuantityOperation.INCREASE) {
    //                     product.stock_quantity += item.request_quantity;
    //                 } else if (
    //                     item.operation === UpdateProductQuantityOperation.DECREASE
    //                 ) {
    //                     product.stock_quantity -= item.request_quantity;
    //                 } else {
    //                     results.push({
    //                         product_id: item.product_id,
    //                         success: false,
    //                         message: 'Phương thức cập nhật không hợp lệ',
    //                     });
    //                     failCount++;
    //                     continue;
    //                 }

    //                 await queryRunner.manager.save(Product, product);
    //                 results.push({
    //                     product_id: item.product_id,
    //                     success: true,
    //                     message: `Cập nhật thành công từ ${previousQuantity} thành ${product.stock_quantity}`,
    //                     previous_quantity: previousQuantity,
    //                     new_quantity: product.stock_quantity,
    //                 });
    //                 successCount++;

    //                 this.logger.debug(
    //                     `Product ${item.product_id} updated: ${previousQuantity} -> ${product.stock_quantity}`,
    //                 );
    //             } catch (error) {
    //                 this.logger.error(
    //                     `Error updating product ${item.product_id}:`,
    //                     error,
    //                 );
    //                 results.push({
    //                     product_id: item.product_id,
    //                     success: false,
    //                     message: `Lỗi hệ thống: ${error.message}`,
    //                 });
    //                 failCount++;
    //             }
    //         }

    //         if (failCount === 0) {
    //             await queryRunner.commitTransaction();
    //             this.logger.log(`Successfully updated ${successCount} products`);
    //             return {
    //                 success: true,
    //                 message: `Cập nhật thành công ${successCount} sản phẩm`,
    //                 results,
    //             };
    //         } else {
    //             await queryRunner.rollbackTransaction();
    //             this.logger.warn(
    //                 `Transaction rolled back: ${successCount} success, ${failCount} failed`,
    //             );
    //             return {
    //                 success: false,
    //                 message: `Có ${failCount} sản phẩm cập nhật thất bại. Đã hoàn tác tất cả thay đổi.`,
    //                 results,
    //             };
    //         }
    //     } catch (error) {
    //         await queryRunner.rollbackTransaction();
    //         this.logger.error('Bulk update products quantity failed:', error);

    //         return {
    //             success: false,
    //             message: `Lỗi hệ thống khi cập nhật hàng loạt: ${error.message}`,
    //             results: items.map((item) => ({
    //                 product_id: item.product_id || 0,
    //                 success: false,
    //                 message: 'Lỗi hệ thống',
    //             })),
    //         };
    //     } finally {
    //         await queryRunner.release();
    //     }
    // }

    // async getTraceabilityData(productId: number): Promise<TraceabilityData> {
    //     // Check if product exists
    //     const product = await this.productsRepository.findOne({
    //         where: { product_id: productId, status: Not(ProductStatus.DELETED) },
    //         relations: ['farm'],
    //     });

    //     if (!product) {
    //         throw new NotFoundException('Sản phẩm không tồn tại');
    //     }

    //     // Get all process assignments for this product
    //     const assignments = await this.assignmentRepository.find({
    //         where: { product: { product_id: productId } },
    //         relations: ['processTemplate', 'processTemplate.steps'],
    //         order: { assigned_date: 'ASC' },
    //     });

    //     // Get all step diary entries for these assignments
    //     const assignmentIds = assignments.map((a) => a.assignment_id);
    //     const stepDiaries =
    //         assignmentIds.length > 0
    //             ? await this.stepDiaryRepository.find({
    //                 where: {
    //                     assignment: { assignment_id: In(assignmentIds) },
    //                 },
    //                 relations: ['assignment', 'step'],
    //                 order: { step_order: 'ASC', recorded_date: 'ASC' },
    //             })
    //             : [];

    //     return {
    //         product,
    //         assignments,
    //         stepDiaries,
    //     };
    // }

    // async verifyProductTraceability(productId: number): Promise<{
    //     isValid: boolean;
    //     error?: string;
    //     verificationDate: Date;
    // }> {
    //     try {
    //         // Get traceability data
    //         const traceabilityData = await this.getTraceabilityData(productId);

    //         if (!traceabilityData.product.blockchain_activated) {
    //             return {
    //                 isValid: false,
    //                 error: 'Sản phẩm chưa được kích hoạt blockchain',
    //                 verificationDate: new Date(),
    //             };
    //         }

    //         // Verify with blockchain
    //         const verificationResult =
    //             await this.blockchainService.verifyProductTraceability(
    //                 traceabilityData,
    //             );

    //         return {
    //             isValid: verificationResult.isValid,
    //             error: verificationResult.error,
    //             verificationDate: new Date(),
    //         };
    //     } catch (error) {
    //         this.logger.error(
    //             `Traceability verification failed for product ${productId}: ${error.message}`,
    //         );
    //         return {
    //             isValid: false,
    //             error: 'Không thể xác minh truy xuất nguồn gốc',
    //             verificationDate: new Date(),
    //         };
    //     }
    // }
}
