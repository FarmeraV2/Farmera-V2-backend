import { BadRequestException, ConflictException, HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from "typeorm";
import { Farm } from '../entities/farm.entity';
import { FptIdrCardFrontData, FptIdrCccdFrontData } from '../interfaces/fpt-idr-front.interface';
import { BiometricService } from '../biometric/biometric.service';
import { Identification } from '../entities/identification.entity';
import { IdentificationMethod, IdentificationStatus } from '../enums/identification.enums';
import { FarmStatus } from '../enums/farm-status.enum';
import { SearchFarmDto } from '../dtos/search-farm.dto';
import { plainToInstance } from 'class-transformer';
import { PaginationOptions } from 'src/common/dtos/pagination/pagination-option.dto';
import { FarmRegistrationDto } from '../dtos/farm-registration.dto';
import { DeliveryAddressService } from 'src/modules/address/delivery-address/delivery-address.service';
import { CreateFarmAddressDto } from 'src/modules/address/dtos/create-address.dto';
import { isUUID } from 'class-validator';
import { UpdateFarmDto } from '../dtos/update-farm.dto';
import { UpdateFarmAvatarDto, UpdateFarmImagesDto } from '../dtos/update-farm-images.dto';

@Injectable()
export class FarmService {

    private readonly logger = new Logger(FarmService.name);

    constructor(
        @InjectRepository(Farm) private farmRepository: Repository<Farm>,
        @InjectDataSource() private dataSource: DataSource,
        // @InjectRepository(Product)
        // private productRepository: Repository<Product>,
        private readonly biometricsService: BiometricService,
        private readonly deliveryAddressService: DeliveryAddressService,
        // private readonly fileStorageService: AzureBlobService,
        // private readonly GhnService: GhnService,
    ) { }

    async farmRegister(registerDto: FarmRegistrationDto, userId: number): Promise<Farm> {
        const isExistingFarm = await this.farmRepository.existsBy({ user_id: userId });
        if (isExistingFarm) {
            throw new ConflictException('Farm already exists');
        }

        // todo!();
        try {
            // validate address
            // const ghn_province_id = await this.GhnService.getIdProvince(
            //     registerDto.city,
            // );

            // if (!ghn_province_id) {
            //     throw new NotFoundException(
            //         `Không tìm thấy ID tỉnh GHN cho thành phố ${registerDto.city}`,
            //     );
            // }
            // const ghn_district_id = await this.GhnService.getIdDistrict(
            //     registerDto.district,
            //     ghn_province_id,
            // );
            // if (!ghn_district_id) {
            //     throw new NotFoundException(
            //         `Không tìm thấy ID quận huyện GHN cho ${registerDto.district} trong tỉnh ${registerDto.city}`,
            //     );
            // }
            // const ghn_ward_id = await this.GhnService.getIdWard(
            //     registerDto.ward,
            //     ghn_district_id,
            // );
            // if (!ghn_ward_id) {
            //     throw new NotFoundException(
            //         `Không tìm thấy ID phường xã GHN cho ${registerDto.ward} trong quận ${registerDto.district}`,
            //     );
            // }
        } catch (error) {
            this.logger.error(error.message);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to register farm');
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // const ghnAddress = new AddressGHN();
            // ghnAddress.province_id = ghn_province_id;
            // ghnAddress.district_id = ghn_district_id;
            // ghnAddress.ward_code = ghn_ward_id;
            // const savedGhnAddress = await queryRunner.manager.save(ghnAddress);

            // create address
            const address = await this.deliveryAddressService.addFarmAddress(plainToInstance(CreateFarmAddressDto, {
                name: registerDto.farm_name,
                ...registerDto,
            }));

            // create farm
            const farm = this.farmRepository.create({
                ...registerDto,
                user_id: userId,
                address
            });
            const savedFarm = await queryRunner.manager.save(farm);

            await queryRunner.commitTransaction();
            // this.logger.debug(
            //     `[Register] Đăng ký farm thành công cho user ${userId}, Farm ID: ${savedFarm.farm_id}`,
            // );

            // // delete biometric video
            // await this.fileStorageService.deleteFile(registerDto.biometric_video_url);

            return savedFarm;
        } catch (dbError) {
            await queryRunner.rollbackTransaction();
            this.logger.error(dbError.message);
            throw new InternalServerErrorException('Failed to register farm');
        } finally {
            await queryRunner.release();
        }
    }

    async verifyBiometric(
        ssnImg: Express.Multer.File,
        faceVideo: Express.Multer.File,
        farmId: number,
        userId: number,
    ): Promise<Farm> {
        let idrData: FptIdrCardFrontData;

        const farm = await this.farmRepository.findOne({
            where: { id: farmId, user_id: userId },
        });
        if (!farm) {
            throw new NotFoundException('Farm not found');
        }

        try {
            // validate ssn by calling fpt api
            // this.logger.debug(`[Register] Bước 1: Gọi FPT IDR cho user ${userId}, file ${ssnImg.originalname}`);
            const idrCardDataArray =
                await this.biometricsService.callFptIdrApiForFront(ssnImg);

            idrData = idrCardDataArray[0];
            // this.logger.debug(`[Register] FPT IDR thành công cho user ${userId}. Loại thẻ: ${idrData.type}, Loại mới: ${idrData.type_new}`);

            // this.logger.log(`[Register] Bước 2: Gọi FPT Liveness cho user ${userId}, ảnh ${ssnImg.originalname}, video ${faceVideo.originalname}`);
            const livenessResult = await this.biometricsService.callFptLivenessApi(
                ssnImg,
                faceVideo,
            );
            // this.logger.log(
            //     `[Register] FPT Liveness thành công cho user ${userId}. Liveness: ${livenessResult.liveness?.is_live}, Match: ${livenessResult.face_match?.isMatch}`,
            // );

            // this.logger.log(
            //     `[Register] Bước 3: Lưu thông tin đăng ký vào database cho user ${userId}.`,
            // );

            // save identification
            const identification = new Identification();
            identification.status = IdentificationStatus.APPROVED;
            identification.method = IdentificationMethod.BIOMETRIC;

            identification.id_number = idrData.id || 'N/A';
            identification.full_name = idrData.name || 'N/A';

            if ('nationality' in idrData) {
                identification.nationality =
                    (idrData as FptIdrCccdFrontData).nationality || 'N/A';
            } else {
                identification.nationality = 'N/A';
            }

            // todo!("handle external file storage")
            // const ssn_img_url = await this.fileStorageService.uploadFile(
            //     ssnImg,
            //     userId,
            // );

            // identification.id_card_image_url = ssn_img_url;
            farm.identification = identification;
            farm.status = FarmStatus.VERIFIED;

            return await this.farmRepository.save(farm);
        } catch (error) {
            this.logger.error(error.message);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException("Failed to verify biometric");
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
    async getUserFarm(id: number): Promise<Farm> {
        const farm = await this.farmRepository.findOne({
            where: { user_id: id },
            relations: ['address'],
        });
        if (!farm) {
            this.logger.error(`Farm not found`);
            throw new NotFoundException(`Farm not found`);
        }
        return farm;
    }

    /**
     * @function getFarmByOwner - Retrieves a farm owned by a specific user, only if its status is VERIFIED or APPROVED
     * @param {string} userId - The UUID of the farm owner
     *
     * @returns {Promise<Farm>} - Returns the farm entity, including its address relation
     *
     * @throws {NotFoundException} - If no matching farm is found for the user
     */
    async getFarmByOwner(userId: string): Promise<Farm> {
        if (!isUUID(userId)) throw new NotFoundException(`Farm not found`);
        try {
            const farm = await this.farmRepository.findOne({
                where: {
                    owner: { uuid: userId },
                    status: In([FarmStatus.VERIFIED, FarmStatus.APPROVED]),
                },
                relations: ['address'],
            });
            if (!farm) {
                this.logger.error(`Farm not found`);
                throw new NotFoundException(`Farm not found`);
            }
            return farm;
        }
        catch (error) {
            this.logger.error(error.message);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException("Failed to find farm");
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
    async findFarmById(farmId: string): Promise<Farm> {
        if (!isUUID(farmId)) throw new NotFoundException(`Farm not found`);
        try {
            const farm = await this.farmRepository.findOne({
                where: {
                    farm_id: farmId,
                    status: In([FarmStatus.VERIFIED, FarmStatus.APPROVED]),
                },
                relations: ['address'],
            });

            if (!farm) {
                throw new NotFoundException(`Farm not found`);
            }
            return farm;
        }
        catch (error) {
            this.logger.error(error.message);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException("Failed to find farm");
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
    async validateFarmer(userId: number): Promise<{ id: number, uuid: string } | undefined> {
        try {
            const farm = await this.farmRepository.findOne({ select: ["id", "farm_id"], where: { user_id: userId } });
            if (!farm || farm.id <= 0) {
                throw new InternalServerErrorException("Something ưent wrong, you're a farmer but your Farm is not found");
            }
            return { id: farm.id, uuid: farm.farm_id };
        }
        catch (error) {
            this.logger.error(error.message);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException("Failed to validate farmer");
        }
    }

    async updateFarm(id: number, updateFarmDto: UpdateFarmDto): Promise<Farm> {
        try {
            const farm = this.farmRepository.create(updateFarmDto);
            await this.farmRepository.update(id, farm);

            const newFarm = await this.farmRepository.findOne({ where: { id } });
            if (!newFarm) {
                throw new NotFoundException(`Farm not found`);
            }
            return newFarm;
        } catch (error) {
            this.logger.error(error.message);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException("Failed to update farm");
        }
    }

    async updateFarmImages(id: number, updateFarmDto: UpdateFarmImagesDto): Promise<Farm> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        const oldProfileImageUrlsToDelete: string[] = [];
        const oldCertificateImageUrlsToDelete: string[] = [];

        try {
            const farm = await this.farmRepository.findOne({
                where: { id: id }
            });

            if (!farm) throw new NotFoundException('Farm not found');

            // update profile images
            const currentProfileImageUrls = farm.profile_image_urls || [];
            const incomingProfileImageUrls = updateFarmDto.profile_image_urls || []; // URLs client wants to keep

            for (const existingUrl of currentProfileImageUrls) {
                if (!incomingProfileImageUrls.includes(existingUrl)) {
                    oldProfileImageUrlsToDelete.push(existingUrl);
                }
            }

            farm.profile_image_urls = incomingProfileImageUrls;

            // update certification images
            const currentCertificateImageUrls = farm.certificate_img_urls || [];
            const incomingCertificateImageUrls =
                updateFarmDto.certificate_image_urls || [];

            for (const existingUrl of currentCertificateImageUrls) {
                if (!incomingCertificateImageUrls.includes(existingUrl)) {
                    oldCertificateImageUrlsToDelete.push(existingUrl);
                }
            }
            farm.certificate_img_urls = incomingCertificateImageUrls;

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
            this.logger.error(error.message);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException("Failed to update images");
        } finally {
            await queryRunner.release();
        }
    }

    async updateFarmAvatar(id: number, updateFarmDto: UpdateFarmAvatarDto): Promise<{ avatar_url: string }> {
        try {
            const farm = await this.farmRepository.findOne({
                select: ["id", "avatar_url"],
                where: { id }
            });

            if (!farm) {
                throw new NotFoundException('Farm not found');
            }

            const oldAvatarUrlToDelete = farm.avatar_url;

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
            throw new InternalServerErrorException("Failed to update farm avatar");
        }
        catch (error) {
            this.logger.error(error.message);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException("Failed to update farm avatar");
        }
    }

    /**
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
            select: ["id"],
            where: { farm_id: uuid }
        })
        if (farm) return farm.id;
        return null;
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
