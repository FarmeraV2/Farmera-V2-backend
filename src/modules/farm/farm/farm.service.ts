import { ConflictException, HttpException, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { Farm } from '../entities/farm.entity';
import { BiometricService } from '../biometric/biometric.service';
import { Identification } from '../entities/identification.entity';
import { FarmStatus } from '../enums/farm-status.enum';
import { plainToInstance } from 'class-transformer';
import { FarmRegistrationDto } from '../dtos/farm/farm-registration.dto';
import { DeliveryAddressService } from 'src/modules/address/delivery-address/delivery-address.service';
import { CreateFarmAddressDto } from 'src/modules/address/dtos/create-address.dto';
import { UpdateFarmDto } from '../dtos/farm/update-farm.dto';
import { UpdateFarmAvatarDto, UpdateFarmImagesDto } from '../dtos/farm/update-farm-images.dto';
import { ResponseCode } from 'src/common/constants/response-code.const';
import { FileStorageService } from 'src/core/file-storage/interfaces/file-storage.interface';
import { FarmDto, farmDtoSelectFields } from '../dtos/farm/farm.dto';
import { publicUserFields } from 'src/modules/user/dtos/user/user.dto';
import { MyFarmDto } from '../dtos/farm/my-farm.dto';
import { AuditService } from 'src/core/audit/audit.service';
import { ActorType } from 'src/core/audit/enums/actor-type';
import { AuditEventID } from 'src/core/audit/enums/audit_event_id';
import { AuditResult } from 'src/core/audit/enums/audit-result';
import { HashService } from 'src/services/hash.service';
import { UserService } from 'src/modules/user/user/user.service';
import { UserRole } from 'src/common/enums/role.enum';
import { ProductService } from 'src/modules/product/product/product.service';
import { PaginationResult } from 'src/common/dtos/pagination/pagination-result.dto';
import { SearchProductsDto } from 'src/modules/product/dtos/product/search-product.dto';
import { FarmProductDetailDto } from 'src/modules/product/dtos/product/farm-product-detail.dto';
import { FarmProductDto } from 'src/modules/product/dtos/product/farm-product.dto';
import { ProductDto } from 'src/modules/product/dtos/product/product.dto';
import { FarmTransparencyMetricsDto } from '../dtos/farm/farm-transparency-metrics.dto';
import { FptIdrCardFrontData } from '../interfaces/fpt-idr-front.interface';
import { FptLivenessResponse } from '../interfaces/fpt-liveness.interfaces';
import { parseDateDMY } from 'src/utils/format';
import { IdentificationStatus } from '../enums/identification.enums';

@Injectable()
export class FarmService {
    private readonly logger = new Logger(FarmService.name);

    constructor(
        @InjectRepository(Farm) private farmRepository: Repository<Farm>,
        @InjectRepository(Identification) private identificationRepository: Repository<Identification>,
        @InjectDataSource() private dataSource: DataSource,
        private readonly biometricsService: BiometricService,
        private readonly deliveryAddressService: DeliveryAddressService,
        private readonly userService: UserService,
        @Inject('FileStorageService') private readonly fileStorage: FileStorageService,
        private readonly auditService: AuditService,
        private readonly hashService: HashService,
        private readonly productService: ProductService,
    ) { }

    async farmRegister(registerDto: FarmRegistrationDto, userId: number): Promise<MyFarmDto> {
        const isExistingFarm = await this.farmRepository.existsBy({ user_id: userId });
        if (isExistingFarm) {
            throw new ConflictException({
                message: 'Farm already exists',
                code: ResponseCode.FARM_EXISTED,
            });
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // create address
            const address_id = await this.deliveryAddressService.addFarmAddress(
                plainToInstance(CreateFarmAddressDto, {
                    name: registerDto.farm_name,
                    ...registerDto,
                }),
                queryRunner.manager
            );

            // create farm
            const farm = this.farmRepository.create({
                ...registerDto,
                user_id: userId,
                address_id: address_id,
            });
            const savedFarm = await queryRunner.manager.save(farm);

            await this.auditService.log({
                actor_type: ActorType.USER,
                audit_event_id: AuditEventID.FARM01,
                actor_id: userId,
                result: AuditResult.SUCCESS,
            }, queryRunner.manager);

            await queryRunner.commitTransaction();

            const address = await this.deliveryAddressService.getAddressById(address_id);

            return plainToInstance(MyFarmDto, { ...savedFarm, address: address }, { excludeExtraneousValues: true });
        } catch (dbError) {
            await queryRunner.rollbackTransaction();
            try {
                await this.auditService.log({
                    actor_type: ActorType.USER,
                    audit_event_id: AuditEventID.FARM01,
                    actor_id: userId,
                    result: AuditResult.FAILED,
                    metadata: dbError.message
                }, queryRunner.manager);
            } catch (_) { }
            this.logger.error(dbError.message);
            throw new InternalServerErrorException({
                message: 'Failed to register farm',
                code: ResponseCode.FAILED_TO_REGISTER_FARM,
            });
        } finally {
            await queryRunner.release();
        }
    }

    async verifyBiometric(ssnImg: Express.Multer.File, faceVideo: Express.Multer.File, farmId: number, userId: number): Promise<MyFarmDto> {
        const farm = await this.farmRepository.findOne({
            where: { id: farmId, user_id: userId },
        });
        if (!farm) {
            throw new NotFoundException({
                message: 'Farm not found',
                code: ResponseCode.FARM_NOT_FOUND,
            });
        }
        const address = await this.deliveryAddressService.getAddressById(farm.address_id);
        if (farm.status !== FarmStatus.PENDING) {
            return plainToInstance(MyFarmDto, { ...farm, address: address }, { excludeExtraneousValues: true });
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const idrCardDataArray = await this.biometricsService.callFptIdrApiForFront(ssnImg);
            const idrData: FptIdrCardFrontData = idrCardDataArray[0];

            await this.auditService.log({
                actor_type: ActorType.USER,
                audit_event_id: AuditEventID.EKYC01,
                actor_id: userId,
                result: AuditResult.SUCCESS,
            })

            const livenessData: FptLivenessResponse = await this.biometricsService.callFptLivenessApi(ssnImg, faceVideo);

            await this.auditService.log({
                actor_type: ActorType.USER,
                audit_event_id: AuditEventID.EKYC02,
                actor_id: userId,
                result: AuditResult.SUCCESS,
                metadata: { liveness: livenessData.liveness, face_match: livenessData.face_match }
            })

            const ssnImgUrl = await this.fileStorage.uploadFile(
                [ssnImg],
                `private/biometric/${userId}`,
            );

            // save identification
            const partial: Partial<Identification> = {
                full_name: idrData.name,
                hashed_id_number: await this.hashService.hashPassword(idrData.id),
                dob: parseDateDMY(idrData.dob),
                gender: idrData.sex || 'N/A',
                nationality: idrData.nationality || 'N/A',
                address: idrData.address || 'N/A',
                address_entity: idrData.address_entities,
                doe: parseDateDMY(idrData.doe),
                face_match_score: livenessData.face_match ? parseFloat(livenessData.face_match.similarity) : 0,
                liveness_score: livenessData.liveness.spoof_prob ? 1 - parseFloat(livenessData.liveness.spoof_prob) : 0,
                status: IdentificationStatus.APPROVED,
            }

            const identification = this.identificationRepository.create(partial);

            if (ssnImgUrl.length > 0) {
                identification.id_card_image_url = ssnImgUrl[0];
            }

            farm.identification = identification;
            farm.status = FarmStatus.VERIFIED;

            const savedFarm = await queryRunner.manager.save(farm);

            await this.userService.updateRole(userId, UserRole.FARMER, queryRunner.manager);

            await this.auditService.log({
                actor_type: ActorType.SYSTEM,
                audit_event_id: AuditEventID.FARM02,
                result: AuditResult.SUCCESS,
            })

            await queryRunner.commitTransaction();

            return plainToInstance(MyFarmDto, { ...savedFarm, address: address }, { excludeExtraneousValues: true });
        } catch (error) {
            await queryRunner.rollbackTransaction();
            try {
                await this.auditService.log({
                    actor_type: ActorType.USER,
                    audit_event_id: AuditEventID.EKYC02,
                    actor_id: userId,
                    result: AuditResult.FAILED,
                    metadata: error.message
                })
            } catch (_) { }
            if (error instanceof HttpException) {
                throw error;
            }
            this.logger.error(error.message);
            throw new InternalServerErrorException({
                message: 'Failed to verify biometric',
                code: ResponseCode.FAILED_TO_VERIFY_BIOMETRIC
            });
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * @function getUserFarm - Retrieves a farm belonging to a specific user
     * @param {number} id - The unique identifier of the user
     *
     * @returns {Promise<Farm>} - Returns the farm entity, including its address relation
     *
     * @throws {NotFoundException} - If the farm for the given user is not found
     */
    async getUserFarm(id: number): Promise<MyFarmDto> {
        const farm = await this.farmRepository.findOne({
            where: { user_id: id }
        });
        if (!farm) {
            throw new NotFoundException({
                message: `Farm not found`,
                code: ResponseCode.FARM_NOT_FOUND,
            });
        }
        const address = await this.deliveryAddressService.getAddressById(farm.address_id);
        if (!address) {
            throw new InternalServerErrorException({
                message: `Farm address not found`,
                code: ResponseCode.INTERNAL_ERROR,
            });
        }
        return plainToInstance(MyFarmDto, { ...farm, address: address }, { excludeExtraneousValues: true });
    }

    /**
     * @function getFarmByOwner - Retrieves a farm owned by a specific user, only if its status is VERIFIED or APPROVED
     * @param {string} userId - The UUID of the farm owner
     *
     * @returns {Promise<Farm>} - Returns the farm entity, including its address relation
     *
     * @throws {NotFoundException} - If no matching farm is found for the user
     */
    async getFarmByOwner(userId: number): Promise<FarmDto> {
        try {
            const queryBuilder = this.farmRepository.createQueryBuilder('farm').select([...farmDtoSelectFields, 'farm.address_id'])
                .where('farm.user_id = :userId', { userId })
                .andWhere('farm.status IN (:...statuses)', {
                    statuses: [FarmStatus.VERIFIED, FarmStatus.APPROVED],
                })
                .leftJoin('farm.owner', 'user').addSelect(publicUserFields.map((prop) => `user.${prop}`));

            const farm = await queryBuilder.getOne();

            if (!farm) {
                throw new NotFoundException({
                    message: `Farm not found`,
                    code: ResponseCode.FARM_NOT_FOUND,
                });
            }
            const address = await this.deliveryAddressService.getAddressById(farm.address_id);

            return plainToInstance(FarmDto, { ...farm, address: address }, { excludeExtraneousValues: true });
        } catch (error) {
            if (error instanceof HttpException) throw error;
            this.logger.error(error.message);
            throw new InternalServerErrorException({
                message: 'Failed to find farm',
                code: ResponseCode.FAILED_TO_GET_FARM,
            });
        }
    }

    /**
     * @function findFarmById - Retrieves a farm by its unique UUID, only if its status is VERIFIED or APPROVED
     * @param {string} farmId - The UUID of the farm
     *
     * @returns {Promise<Farm>} - Returns the farm entity, including its address relation
     *
     * @throws {NotFoundException} - If no farm is found with the given UUID
     */
    async findFarmById(farmId: number): Promise<FarmDto> {
        try {
            const queryBuilder = this.farmRepository.createQueryBuilder('farm').select([...farmDtoSelectFields, 'farm.address_id'])
                .where('farm.id = :farmId', { farmId })
                .andWhere('farm.status IN (:...statuses)', {
                    statuses: [FarmStatus.VERIFIED, FarmStatus.APPROVED],
                })
                .leftJoin('farm.owner', 'user').addSelect(publicUserFields.map((prop) => `user.${prop}`));

            const farm = await queryBuilder.getOne();

            if (!farm) {
                throw new NotFoundException({
                    message: `Farm not found`,
                    code: ResponseCode.FARM_NOT_FOUND,
                });
            }
            const address = await this.deliveryAddressService.getAddressById(farm.address_id);

            return plainToInstance(FarmDto, { ...farm, address: address }, { excludeExtraneousValues: true });
        } catch (error) {
            if (error instanceof HttpException) throw error;
            this.logger.error(error.message);
            throw new InternalServerErrorException({
                message: 'Failed to find farm',
                code: ResponseCode.FAILED_TO_GET_FARM
            });
        }
    }

    /**
     * @function validateFarmer - Validates and retrieves the farm id linked to a given user ID
     * @param {number} userId - The ID of the user to validate as a farmer
     *
     * @returns {Promise<{ id: number, uuid: string } | undefined>} - Returns the farm's ID and UUID if found
     *
     * @throws {InternalServerErrorException} - If an unexpected error occurs during the validation process
     */
    async validateFarmer(userId: number): Promise<{ id: number; uuid: string } | undefined> {
        try {
            const farm = await this.farmRepository.findOne({ select: ['id', 'farm_id'], where: { user_id: userId, status: In([FarmStatus.APPROVED, FarmStatus.VERIFIED]) } });
            if (!farm || farm.id <= 0) {
                throw new InternalServerErrorException({
                    message: "Something went wrong, you're a farmer but your Farm is not found",
                    code: ResponseCode.INTERNAL_ERROR
                });
            }
            return { id: farm.id, uuid: farm.farm_id };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            this.logger.error(error.message);
            throw new InternalServerErrorException({
                message: 'Failed to validate farmer',
                code: ResponseCode.FAILED_TO_VALIDATE,
            });
        }
    }

    async updateFarm(id: number, updateFarmDto: UpdateFarmDto): Promise<Farm> {
        try {
            const farm = this.farmRepository.create(updateFarmDto);
            await this.farmRepository.update(id, farm);

            const newFarm = await this.farmRepository.findOne({ where: { id } });
            if (!newFarm) {
                throw new NotFoundException({
                    message: `Farm not found`,
                    code: ResponseCode.FARM_NOT_FOUND,
                });
            }
            return newFarm;
        } catch (error) {
            if (error instanceof HttpException) throw error;
            this.logger.error(error.message);
            throw new InternalServerErrorException({
                message: 'Failed to update farm',
                code: ResponseCode.FAILED_TO_UPDATE_FARM,
            });
        }
    }

    async updateFarmImages(id: number, updateFarmDto: UpdateFarmImagesDto): Promise<Farm> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        const oldProfileImageUrlsToDelete: string[] = [];

        try {
            const farm = await this.farmRepository.findOne({
                where: { id: id },
            });

            if (!farm) throw new NotFoundException({
                message: 'Farm not found',
                code: ResponseCode.FARM_NOT_FOUND,
            });

            // update profile images
            const currentProfileImageUrls = farm.profile_image_urls || [];
            const incomingProfileImageUrls = updateFarmDto.profile_image_urls || []; // URLs client wants to keep

            for (const existingUrl of currentProfileImageUrls) {
                if (!incomingProfileImageUrls.includes(existingUrl)) {
                    oldProfileImageUrlsToDelete.push(existingUrl);
                }
            }

            farm.profile_image_urls = incomingProfileImageUrls;

            farm.updated = new Date();
            const newFarm = await queryRunner.manager.save(Farm, farm);

            await queryRunner.commitTransaction();

            //  After successful commit, delete old files from storage
            // if (oldAvatarUrlToDelete) {
            //     this.fileStorageService
            //         .deleteFile(oldAvatarUrlToDelete)
            //         .catch((err) => {
            //             this.logger.error('Failed to delete old avatar:', err);
            //         });
            // }
            // if (oldProfileImageUrlsToDelete.length > 0) {
            //     oldProfileImageUrlsToDelete.forEach((value) => {
            //         this.fileStorageService.deleteFile(value).catch((err) => {
            //             this.logger.error('Failed to delete old profile images:', err);
            //         });
            //     });
            // }
            // if (oldCertificateImageUrlsToDelete.length > 0) {
            //     oldCertificateImageUrlsToDelete.forEach((value) => {
            //         this.fileStorageService.deleteFile(value).catch((err) => {
            //             this.logger.error('Failed to delete old certificate images:', err);
            //         });
            //     });
            // }

            return newFarm;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            if (error instanceof HttpException) throw error;
            this.logger.error(error.message);
            throw new InternalServerErrorException({
                message: 'Failed to update images',
                code: ResponseCode.FAILED_TO_UPDATE_FARM,
            });
        } finally {
            await queryRunner.release();
        }
    }

    async updateFarmAvatar(id: number, updateFarmDto: UpdateFarmAvatarDto): Promise<{ avatar_url: string }> {
        try {
            const farm = await this.farmRepository.findOne({
                select: ['id', 'avatar_url'],
                where: { id },
            });

            if (!farm) {
                throw new NotFoundException({
                    message: 'Farm not found',
                    code: ResponseCode.FARM_NOT_FOUND,
                });
            }

            // const oldAvatarUrlToDelete = farm.avatar_url;

            const result = await this.farmRepository.update(id, { avatar_url: updateFarmDto.avatar_url });

            // todo!()
            // if (oldAvatarUrlToDelete) {
            //     this.fileStorageService
            //         .deleteFile(oldAvatarUrlToDelete)
            //         .catch((err) => {
            //             this.logger.error('Failed to delete old avatar:', err);
            //         });
            // }

            if (result.affected && result.affected > 0) {
                return { avatar_url: updateFarmDto.avatar_url };
            }
            throw new InternalServerErrorException({
                message: 'Failed to update farm avatar',
                code: ResponseCode.FAILED_TO_UPDATE_FARM,
            });
        } catch (error) {
            if (error instanceof HttpException) throw error;
            this.logger.error(error.message);
            throw new InternalServerErrorException({
                message: 'Failed to update farm avatar',
                code: ResponseCode.FAILED_TO_UPDATE_FARM
            });
        }
    }

    /**
     * DEPRECATED
     * @function getId - Retrieves the numeric ID of a farm by its UUID
     * @param {string} uuid - The UUID of the farm
     *
     * @returns {Promise<number | null>} - Returns the farm ID if found, otherwise null
     *
     * @WARNING This function should **NOT** be called directly from controllers or exposed to end users.
     * Always wrap this method inside a service-level function that enforces ownership and validation checks.
     */
    async getId(uuid: string): Promise<number | null> {
        // todo!("cache");
        const farm = await this.farmRepository.findOne({
            select: ['id'],
            where: { farm_id: uuid },
        });
        if (farm) return farm.id;
        return null;
    }

    async updateFarmStatus(farmId: number, status: FarmStatus, manager?: EntityManager): Promise<void> {
        const repo = manager ? manager.getRepository(Farm) : this.farmRepository;
        try {
            const result = await repo.update(farmId, { status: status });
            if (!result || !result.affected || result.affected <= 0) {
                throw new InternalServerErrorException();
            }
        } catch (error) {
            this.logger.error("Failed to update farm status");
            throw new InternalServerErrorException({
                message: "Failed to update farm status",
                code: ResponseCode.FAILED_TO_UPDATE_FARM
            })
        }
    }

    async getMyFarmProducts(farmId: number, getProductDto: SearchProductsDto): Promise<PaginationResult<FarmProductDto>> {
        return await this.productService.getFarmProducts(farmId, getProductDto);
    }

    async getFarmProducts(farmId: number, getProductDto: SearchProductsDto): Promise<PaginationResult<ProductDto>> {
        return await this.productService.searchAndFilterProducts(getProductDto, farmId);
    }

    async getMyFarmProductById(productId: number): Promise<FarmProductDetailDto> {
        return await this.productService.getFarmProductById(productId);
    }

    async getAllFarmIds(): Promise<number[]> {
        try {
            const farms = await this.farmRepository.find({
                select: ["id"]
            })
            return farms.map((f) => f.id);
        }
        catch (error) {
            throw Error(`Failed to get all farm ids: ${error.message}`);
        }
    }

    async getFarmProductRating(farmId: number): Promise<number[]> {
        return await this.productService.getProductRatings(farmId);
    }

    async updateTransparencyScore(farmId: number, score: FarmTransparencyMetricsDto, manager?: EntityManager): Promise<void> {
        try {
            const repo = manager ? manager.getRepository(Farm) : this.farmRepository;
            await repo.update(
                { id: farmId },
                { transparency_score: score })
        }
        catch (error) {
            this.logger.error(`Failed to update season transparency score: ${error.message}`);
            throw new InternalServerErrorException({
                message: "Failed to update season transparency score",
                code: ResponseCode.FAILED_TO_UPDATE_SEASON
            })
        }
    }

    //   async findFarmsByIds(farmIds: string[]): Promise<Farm[]> {
    //     // Hoặc number[]
    //     if (!farmIds || farmIds.length === 0) {
    //       return [];
    //     }

    //     const result = await this.farmRepository.find({
    //       where: { farm_id: In(farmIds) },
    //       relations: ['address', 'address.address_ghn'],
    //     });
    //     this.logger.log(`result: ${JSON.stringify(result, null, 2)}`);
    //     return result;
    //   }

    //   async listFarms(
    //     paginationOptions?: PaginationOptions,
    //   ): Promise<PaginationResult<Farm>> {
    //     // If no pagination options provided, return all categories (for backward compatibility)
    //     if (!paginationOptions) {
    //       const farms = await this.farmRepository.find({
    //         relations: ['address'],
    //         order: { farm_name: 'ASC' },
    //       });
    //       if (!farms || farms.length === 0) {
    //         this.logger.error('Không tìm thấy danh mục nào.');
    //         throw new NotFoundException('Không tìm thấy danh mục nào.');
    //       }
    //       return new PaginationResult(farms);
    //     }

    //     // Use pagination
    //     const queryBuilder = this.farmRepository
    //       .createQueryBuilder('farm')
    //       .leftJoinAndSelect('farm.address', 'address');

    //     // Add sorting if specified
    //     if (paginationOptions.sort_by) {
    //       const validSortValue = ['created', 'farm_name', 'status'];
    //       if (!validSortValue.includes(paginationOptions.sort_by)) {
    //         throw new BadRequestException('Cột sắp xếp không hợp lệ.');
    //       }

    //       const order = (paginationOptions.order || 'ASC') as 'ASC' | 'DESC';
    //       switch (paginationOptions.sort_by) {
    //         case 'farm_name':
    //           queryBuilder.orderBy('farm.farm_name', order);
    //           break;
    //         case 'created':
    //           queryBuilder.orderBy('farm.created', order);
    //           break;
    //         case 'status':
    //           queryBuilder.orderBy('farm.status', order);
    //           break;
    //         default:
    //           queryBuilder.orderBy('farm.farm_name', 'ASC');
    //       }
    //     } else {
    //       queryBuilder.orderBy(
    //         'farm.farm_name',
    //         (paginationOptions.order || 'ASC') as 'ASC' | 'DESC',
    //       );
    //     }

    //     // If all=true, return all results without pagination
    //     if (paginationOptions.all) {
    //       const farms = await queryBuilder.getMany();
    //       if (!farms || farms.length === 0) {
    //         this.logger.error('Không tìm thấy danh mục nào.');
    //         throw new NotFoundException('Không tìm thấy danh mục nào.');
    //       }
    //       return new PaginationResult(farms);
    //     }

    //     // Apply pagination
    //     const totalItems = await queryBuilder.getCount();

    //     const totalPages = Math.ceil(totalItems / (paginationOptions.limit ?? 10));
    //     const currentPage = paginationOptions.page ?? 1;

    //     if (totalPages > 0 && currentPage > totalPages) {
    //       throw new NotFoundException(
    //         `Không tìm thấy dữ liệu ở trang ${currentPage}.`,
    //       );
    //     }

    //     const farms = await queryBuilder
    //       .skip(paginationOptions.skip)
    //       .take(paginationOptions.limit)
    //       .getMany();

    //     if (!farms || farms.length === 0) {
    //       this.logger.error('Không tìm thấy danh mục nào.');
    //       throw new NotFoundException('Không tìm thấy danh mục nào.');
    //     }

    //     const meta = new PaginationMeta({
    //       paginationOptions,
    //       totalItems,
    //     });

    //     return new PaginationResult(farms, meta);
    //   }

    // async searchFarm(searchDto: SearchFarmDto) {
    //     const paginationOptions = plainToInstance(PaginationOptions, searchDto);

    //     const qb = this.farmRepository
    //         .createQueryBuilder('farm')
    //         .leftJoinAndSelect('farm.address', 'address');

    //     if (searchDto.latitude && searchDto.longitude && searchDto.radius_km) {
    //         qb.addSelect(
    //             `
    //                     6371 * acos(
    //                     cos(radians(:lat)) *
    //                     cos(radians(split_part(address.coordinate, ':', 1)::float)) *
    //                     cos(radians(split_part(address.coordinate, ':', 2)::float) - radians(:lng)) +
    //                     sin(radians(:lat)) *
    //                     sin(radians(split_part(address.coordinate, ':', 1)::float))
    //                     )
    //                 `,
    //             'distance',
    //         ).andWhere(
    //             `
    //                     6371 * acos(
    //                     cos(radians(:lat)) *
    //                     cos(radians(split_part(address.coordinate, ':', 1)::float)) *
    //                     cos(radians(split_part(address.coordinate, ':', 2)::float) - radians(:lng)) +
    //                     sin(radians(:lat)) *
    //                     sin(radians(split_part(address.coordinate, ':', 1)::float))
    //                     ) <= :radius
    //                 `,
    //             {
    //                 lat: searchDto.latitude,
    //                 lng: searchDto.longitude,
    //                 radius: searchDto.radius_km,
    //             },
    //         );
    //     }

    //     if (searchDto.query?.trim()) {
    //         qb.andWhere('farm.farm_name ILIKE :query', {
    //             query: `%${searchDto.query}%`,
    //         });
    //     }

    //     if (searchDto.approve_only) {
    //         qb.andWhere('farm.status = :status', { status: FarmStatus.APPROVED });
    //     }
    //     else {
    //         qb.andWhere('farm.status IN (:...statuses)', {
    //             statuses: [FarmStatus.APPROVED, FarmStatus.VERIFIED],
    //         });
    //     }

    //     // Add sorting if specified
    //     if (paginationOptions.sort_by) {
    //         const validSortValue = ['created', 'farm_name', 'status', 'distance'];
    //         if (!validSortValue.includes(paginationOptions.sort_by)) {
    //             throw new BadRequestException('Cột sắp xếp không hợp lệ.');
    //         }
    //         const order = (paginationOptions.order || 'ASC') as 'ASC' | 'DESC';
    //         switch (paginationOptions.sort_by) {
    //             case 'name':
    //                 qb.orderBy('farm.farm_name', order);
    //                 break;
    //             case 'created':
    //                 qb.orderBy('farm.created', order);
    //                 break;
    //             case 'distance':
    //                 qb.orderBy('distance', order);
    //             default:
    //                 qb.orderBy('farm.farm_name', 'ASC');
    //         }
    //     } else {
    //         qb.orderBy(
    //             'farm.farm_name',
    //             (paginationOptions.order || 'ASC') as 'ASC' | 'DESC',
    //         );
    //     }

    //     // If all=true, return all results without pagination
    //     if (paginationOptions.all) {
    //         const farms = await qb.getMany();
    //         if (!farms || farms.length === 0) {
    //             this.logger.error('Không tìm thấy danh mục nào.');
    //             throw new NotFoundException('Không tìm thấy danh mục nào.');
    //         }
    //         return new PaginationResult(farms);
    //     }

    //     // Apply pagination
    //     const totalItems = await qb.getCount();

    //     const totalPages = Math.ceil(totalItems / (paginationOptions.limit ?? 10));
    //     const currentPage = paginationOptions.page ?? 1;

    //     if (totalPages > 0 && currentPage > totalPages) {
    //         throw new NotFoundException(
    //             `Không tìm thấy dữ liệu ở trang ${currentPage}.`,
    //         );
    //     }

    //     const farms = await qb
    //         .skip(paginationOptions.skip)
    //         .take(paginationOptions.limit)
    //         .getMany();

    //     if (!farms || farms.length === 0) {
    //         this.logger.error('Không tìm thấy danh mục nào.');
    //         throw new NotFoundException('Không tìm thấy danh mục nào.');
    //     }

    //     const meta = new PaginationMeta({
    //         paginationOptions,
    //         totalItems,
    //     });

    //     return new PaginationResult(farms, meta);
    // }

    //   async getFarmStats(farmId: string): Promise<FarmStats> {
    //     const result = await this.productRepository
    //       .createQueryBuilder('product')
    //       .select('COUNT(*)', 'product_count')
    //       .addSelect('AVG(product.average_rating)', 'avg_rating')
    //       .addSelect('SUM(product.total_sold)', 'sold_count')
    //       .where('product.farm_id = :farmId', { farmId })
    //       .getRawOne();

    //     return {
    //       productCount: Number(result.product_count),
    //       averageRating: parseFloat(result.avg_rating),
    //       soldCount: Number(result.sold_count),
    //       followersCount: 0,
    //     };
    //   }

    //   async getFarmAddress(farmId: string): Promise<Address | null> {
    //     return await this.addressRepository.findOne({ where: { farm: { farm_id: farmId } } });
    //   }
}
