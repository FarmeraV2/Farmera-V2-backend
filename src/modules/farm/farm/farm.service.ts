import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from "typeorm";
import { Farm } from '../entities/farm.entity';

@Injectable()
export class FarmService {

    private readonly logger = new Logger(FarmService.name);

    constructor(
        @InjectRepository(Farm)
        private farmsRepository: Repository<Farm>,
        // @InjectRepository(Product)
        // private productRepository: Repository<Product>,
        // @InjectRepository(Address)
        // private addressRepository: Repository<Address>,
        // private readonly biometricsService: BiometricsService,
        // @InjectDataSource()
        // private dataSource: DataSource,
        // private readonly fileStorageService: AzureBlobService,
        // private readonly GhnService: GhnService,
    ) { }

    // async farmRegister(
    //     registerDto: FarmRegistrationDto,
    //     userId: string,
    // ): Promise<Farm> {
    //     const existingFarm = await this.farmsRepository.findOne({
    //         where: { user_id: userId },
    //     });
    //     if (existingFarm) {
    //         throw new ConflictException('Người dùng đã tạo một trang trại trước đó.');
    //     }

    //     try {
    //         // validate address
    //         const ghn_province_id = await this.GhnService.getIdProvince(
    //             registerDto.city,
    //         );

    //         if (!ghn_province_id) {
    //             throw new NotFoundException(
    //                 `Không tìm thấy ID tỉnh GHN cho thành phố ${registerDto.city}`,
    //             );
    //         }
    //         const ghn_district_id = await this.GhnService.getIdDistrict(
    //             registerDto.district,
    //             ghn_province_id,
    //         );
    //         if (!ghn_district_id) {
    //             throw new NotFoundException(
    //                 `Không tìm thấy ID quận huyện GHN cho ${registerDto.district} trong tỉnh ${registerDto.city}`,
    //             );
    //         }
    //         const ghn_ward_id = await this.GhnService.getIdWard(
    //             registerDto.ward,
    //             ghn_district_id,
    //         );
    //         if (!ghn_ward_id) {
    //             throw new NotFoundException(
    //                 `Không tìm thấy ID phường xã GHN cho ${registerDto.ward} trong quận ${registerDto.district}`,
    //             );
    //         }

    //         const queryRunner = this.dataSource.createQueryRunner();
    //         await queryRunner.connect();
    //         await queryRunner.startTransaction();

    //         try {
    //             const ghnAddress = new AddressGHN();
    //             ghnAddress.province_id = ghn_province_id;
    //             ghnAddress.district_id = ghn_district_id;
    //             ghnAddress.ward_code = ghn_ward_id;
    //             const savedGhnAddress = await queryRunner.manager.save(ghnAddress);

    //             const farm = new Farm();
    //             farm.farm_name = registerDto.farm_name;
    //             farm.description = registerDto.description || '';
    //             farm.email = registerDto.email;
    //             farm.phone = registerDto.phone;
    //             farm.tax_number = registerDto.tax_number || '';
    //             farm.user_id = userId;
    //             farm.status = FarmStatus.PENDING;

    //             const address = new Address();
    //             address.city = registerDto.city;
    //             address.district = registerDto.district;
    //             address.ward = registerDto.ward;
    //             address.street = registerDto.street;
    //             address.coordinate = registerDto.coordinate || '';
    //             farm.address = address;
    //             address.address_ghn = savedGhnAddress;

    //             const savedFarm = await queryRunner.manager.save(farm);
    //             await queryRunner.commitTransaction();
    //             this.logger.debug(
    //                 `[Register] Đăng ký farm thành công cho user ${userId}, Farm ID: ${savedFarm.farm_id}`,
    //             );

    //             // // delete biometric video
    //             // await this.fileStorageService.deleteFile(registerDto.biometric_video_url);

    //             return savedFarm;
    //         } catch (dbError: any) {
    //             await queryRunner.rollbackTransaction();
    //             throw new InternalServerErrorException(
    //                 'Không thể lưu dữ liệu đăng ký vào database.',
    //             );
    //         } finally {
    //             await queryRunner.release();
    //         }
    //     } catch (error: any) {
    //         this.logger.error(
    //             `[Register] Quy trình đăng ký thất bại cho user ${userId}: ${error.message}`,
    //             error.stack,
    //         );
    //         if (error instanceof HttpException) {
    //             throw error;
    //         }
    //         throw new InternalServerErrorException(
    //             error.message ||
    //             'Đã xảy ra lỗi không mong muốn trong quá trình đăng ký farm.',
    //         );
    //     }
    // }

    //   async verifyBiometric(
    //     ssnImg: Express.Multer.File,
    //     faceVideo: Express.Multer.File,
    //     farmId: string,
    //     user: string,
    //   ): Promise<Farm> {
    //     let idrData: FptIdrCardFrontData;

    //     const farm = await this.farmsRepository.findOne({
    //       where: { farm_id: farmId },
    //     });
    //     if (!farm) {
    //       throw new NotFoundException('Không tìm thấy farm');
    //     }
    //     const userId = farm.user_id;
    //     if (user !== userId) {
    //       throw new UnauthorizedException();
    //     }

    //     try {
    //       // validate ssn
    //       this.logger.log(
    //         `[Register] Bước 1: Gọi FPT IDR cho user ${userId}, file ${ssnImg.originalname}`,
    //       );
    //       const idrCardDataArray =
    //         await this.biometricsService.callFptIdrApiForFront(ssnImg);

    //       idrData = idrCardDataArray[0];
    //       this.logger.log(
    //         `[Register] FPT IDR thành công cho user ${userId}. Loại thẻ: ${idrData.type}, Loại mới: ${idrData.type_new}`,
    //       );

    //       this.logger.log(
    //         `[Register] Bước 2: Gọi FPT Liveness cho user ${userId}, ảnh ${ssnImg.originalname}, video ${faceVideo.originalname}`,
    //       );
    //       const livenessResult = await this.biometricsService.callFptLivenessApi(
    //         ssnImg,
    //         faceVideo,
    //       );
    //       this.logger.log(
    //         `[Register] FPT Liveness thành công cho user ${userId}. Liveness: ${livenessResult.liveness?.is_live}, Match: ${livenessResult.face_match?.isMatch}`,
    //       );

    //       this.logger.log(
    //         `[Register] Bước 3: Lưu thông tin đăng ký vào database cho user ${userId}.`,
    //       );

    //       const identification = new Identification();
    //       identification.status = IdentificationStatus.APPROVED;
    //       identification.method = IdentificationMethod.BIOMETRIC;

    //       identification.id_number = idrData.id || 'N/A';
    //       identification.full_name = idrData.name || 'N/A';

    //       if ('nationality' in idrData) {
    //         identification.nationality =
    //           (idrData as FptIdrCccdFrontData).nationality || 'N/A';
    //       } else {
    //         identification.nationality = 'N/A';
    //       }

    //       const ssn_img_url = await this.fileStorageService.uploadFile(
    //         ssnImg,
    //         userId,
    //       );

    //       identification.id_card_imageUrl = ssn_img_url;
    //       farm.identification = identification;
    //       farm.status = FarmStatus.VERIFIED;

    //       return await this.farmsRepository.save(farm);
    //     } catch (error) {
    //       this.logger.error(
    //         `[Register] Quy trình đăng ký thất bại cho user ${userId}: ${error.message}`,
    //         error.stack,
    //       );
    //       if (error instanceof HttpException) {
    //         throw error;
    //       }
    //       throw new InternalServerErrorException(
    //         error.message ||
    //         'Đã xảy ra lỗi không mong muốn trong quá trình đăng ký farm.',
    //       );
    //     }
    //   }

    //   async findByUserID(userId: string): Promise<Farm> {
    //     const farm = await this.farmsRepository.findOne({
    //       where: {
    //         user_id: userId,
    //         // status: In([FarmStatus.VERIFIED, FarmStatus.APPROVED]),
    //       },
    //       relations: ['address', 'address.address_ghn'],
    //     });
    //     if (!farm) {
    //       this.logger.error(
    //         `Không tìm thấy trang trại của người dùng với ID ${userId}`,
    //       );
    //       throw new NotFoundException(
    //         `Không tìm thấy trang trại của người dùng với ID ${userId}`,
    //       );
    //     }
    //     return farm;
    //   }

    //   async findFarmById(farmId: string): Promise<Farm> {
    //     if (!isUUID(farmId)) {
    //       this.logger.error(`Invalid UUID format: ${farmId}`);
    //       throw new BadRequestException(`ID trang trại không hợp lệ.`);
    //     }
    //     const farm = await this.farmsRepository.findOne({
    //       where: { farm_id: farmId },
    //       relations: ['address', 'address.address_ghn'],
    //     });

    //     if (!farm) {
    //       throw new NotFoundException(`Không tìm thấy trang trại với ID ${farmId}`);
    //     }
    //     // this.logger.log(`Farm found: ${JSON.stringify(farm, null, 2)}`);
    //     return farm;
    //   }

    //   async findFarmsByIds(farmIds: string[]): Promise<Farm[]> {
    //     // Hoặc number[]
    //     if (!farmIds || farmIds.length === 0) {
    //       return [];
    //     }

    //     const result = await this.farmsRepository.find({
    //       where: { farm_id: In(farmIds) },
    //       relations: ['address', 'address.address_ghn'],
    //     });
    //     this.logger.log(`result: ${JSON.stringify(result, null, 2)}`);
    //     return result;
    //   }

    //   async updateFarm(
    //     farmId: string,
    //     updateFarmDto: UpdateFarmDto,
    //     user_id: string,
    //   ): Promise<Farm> {
    //     const queryRunner = this.dataSource.createQueryRunner();
    //     await queryRunner.connect();
    //     await queryRunner.startTransaction();

    //     let oldAvatarUrlToDelete: string | null = null;
    //     const oldProfileImageUrlsToDelete: string[] = [];
    //     const oldCertificateImageUrlsToDelete: string[] = [];

    //     try {
    //       const farm = await this.farmsRepository.findOne({
    //         where: { farm_id: farmId },
    //         relations: ['address'],
    //       });

    //       if (!farm) {
    //         throw new NotFoundException('Không tìm thấy trang trại');
    //       }

    //       console.log('farm', farm);
    //       console.log('updateFarmDto', updateFarmDto);
    //       console.log('user_id', user_id);

    //       if (farm.user_id !== user_id) {
    //         throw new BadRequestException(
    //           'Người dùng không có quyền cập nhật trang trại này',
    //         );
    //       }

    //       // update fields
    //       const fieldsToCheck = [
    //         'farm_name',
    //         'description',
    //         'email',
    //         'phone',
    //         'tax_number',
    //       ];
    //       for (const field of fieldsToCheck) {
    //         if (
    //           updateFarmDto[field] !== undefined &&
    //           updateFarmDto[field] !== farm[field]
    //         ) {
    //           farm[field] = updateFarmDto[field];
    //         }
    //       }

    //       // update avatar
    //       if (updateFarmDto.avatar_url) {
    //         if (farm.avatar_url) {
    //           oldAvatarUrlToDelete = farm.avatar_url;
    //         }
    //         farm.avatar_url = updateFarmDto.avatar_url;
    //       }

    //       // update profile images
    //       const currentProfileImageUrls = farm.profile_image_urls || [];
    //       const incomingProfileImageUrls = updateFarmDto.profile_image_urls || []; // URLs client wants to keep

    //       for (const existingUrl of currentProfileImageUrls) {
    //         if (!incomingProfileImageUrls.includes(existingUrl)) {
    //           oldProfileImageUrlsToDelete.push(existingUrl);
    //         }
    //       }

    //       farm.profile_image_urls = incomingProfileImageUrls;

    //       // update certification images
    //       const currentCertificateImageUrls = farm.certificate_img_urls || [];
    //       const incomingCertificateImageUrls =
    //         updateFarmDto.certificate_image_urls || [];

    //       for (const existingUrl of currentCertificateImageUrls) {
    //         if (!incomingCertificateImageUrls.includes(existingUrl)) {
    //           oldCertificateImageUrlsToDelete.push(existingUrl);
    //         }
    //       }
    //       farm.certificate_img_urls = incomingCertificateImageUrls;

    //       if (!farm.address) {
    //         farm.address = new Address();
    //       }

    //       let addressUpdated = false;
    //       const addressFieldsToCheck = [
    //         'city',
    //         'district',
    //         'ward',
    //         'street',
    //         'coordinate',
    //       ];
    //       for (const field of addressFieldsToCheck) {
    //         if (
    //           updateFarmDto[field] !== undefined &&
    //           updateFarmDto[field] !== farm.address[field]
    //         ) {
    //           farm.address[field] = updateFarmDto[field];
    //         }
    //       }

    //       if (addressUpdated) {
    //         await queryRunner.manager.save(Address, farm.address);
    //       }

    //       farm.updated = new Date();
    //       await queryRunner.manager.save(Farm, farm);

    //       await queryRunner.commitTransaction();

    //       //  After successful commit, delete old files from storage
    //       if (oldAvatarUrlToDelete) {
    //         this.fileStorageService
    //           .deleteFile(oldAvatarUrlToDelete)
    //           .catch((err) => {
    //             this.logger.error('Failed to delete old avatar:', err);
    //           });
    //       }
    //       if (oldProfileImageUrlsToDelete.length > 0) {
    //         oldProfileImageUrlsToDelete.forEach((value) => {
    //           this.fileStorageService.deleteFile(value).catch((err) => {
    //             this.logger.error('Failed to delete old profile images:', err);
    //           });
    //         });
    //       }
    //       if (oldCertificateImageUrlsToDelete.length > 0) {
    //         oldCertificateImageUrlsToDelete.forEach((value) => {
    //           this.fileStorageService.deleteFile(value).catch((err) => {
    //             this.logger.error('Failed to delete old certificate images:', err);
    //           });
    //         });
    //       }

    //       const newFarm = await this.farmsRepository.findOne({
    //         where: { farm_id: farmId },
    //         relations: ['address'],
    //       });
    //       if (!newFarm) {
    //         throw new NotFoundException(
    //           `Không tìm thấy trang trại với ID ${farmId}`,
    //         );
    //       }
    //       return newFarm;
    //     } catch (error) {
    //       await queryRunner.rollbackTransaction();
    //       throw new InternalServerErrorException(
    //         `Không thể cập nhật trang trại: ${error.message}`,
    //       );
    //     } finally {
    //       await queryRunner.release();
    //     }
    //   }

    //   async listFarms(
    //     paginationOptions?: PaginationOptions,
    //   ): Promise<PaginationResult<Farm>> {
    //     // If no pagination options provided, return all categories (for backward compatibility)
    //     if (!paginationOptions) {
    //       const farms = await this.farmsRepository.find({
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
    //     const queryBuilder = this.farmsRepository
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

    //   async searchFarm(
    //     searchDto: SearchFarmDto,
    //     paginationOptions: PaginationOptions,
    //   ) {
    //     // If no pagination options provided, return all categories (for backward compatibility)
    //     if (!paginationOptions) {
    //       const where: any = {};
    //       if (searchDto.query?.trim()) {
    //         where.farm_name = ILike(`%${searchDto.query}%`);
    //       }
    //       const farms = await this.farmsRepository.find({
    //         where,
    //         relations: ['subcategories'],
    //         order: { created: 'DESC' },
    //       });
    //       if (!farms || farms.length === 0) {
    //         this.logger.error('Không tìm thấy danh mục nào.');
    //         throw new NotFoundException('Không tìm thấy danh mục nào.');
    //       }
    //       return new PaginationResult(farms);
    //     }

    //     // Use pagination
    //     const qb = this.farmsRepository
    //       .createQueryBuilder('farm')
    //       .leftJoinAndSelect('farm.address', 'address');

    //     if (searchDto.latitude && searchDto.longitude && searchDto.radius_km) {
    //       qb.addSelect(
    //         `
    //                     6371 * acos(
    //                     cos(radians(:lat)) *
    //                     cos(radians(split_part(address.coordinate, ':', 1)::float)) *
    //                     cos(radians(split_part(address.coordinate, ':', 2)::float) - radians(:lng)) +
    //                     sin(radians(:lat)) *
    //                     sin(radians(split_part(address.coordinate, ':', 1)::float))
    //                     )
    //                 `,
    //         'distance',
    //       ).andWhere(
    //         `
    //                     6371 * acos(
    //                     cos(radians(:lat)) *
    //                     cos(radians(split_part(address.coordinate, ':', 1)::float)) *
    //                     cos(radians(split_part(address.coordinate, ':', 2)::float) - radians(:lng)) +
    //                     sin(radians(:lat)) *
    //                     sin(radians(split_part(address.coordinate, ':', 1)::float))
    //                     ) <= :radius
    //                 `,
    //         {
    //           lat: searchDto.latitude,
    //           lng: searchDto.longitude,
    //           radius: searchDto.radius_km,
    //         },
    //       );
    //     }

    //     if (searchDto.query?.trim()) {
    //       qb.andWhere('farm.farm_name ILIKE :query', {
    //         query: `%${searchDto.query}%`,
    //       });
    //     }

    //     if (searchDto.approve_only) {
    //       qb.andWhere('farm.status = :status', { status: FarmStatus.APPROVED });
    //     }
    //     else {
    //       qb.andWhere('farm.status IN (:...statuses)', {
    //         statuses: [FarmStatus.APPROVED, FarmStatus.VERIFIED],
    //       });
    //     }

    //     // Add sorting if specified
    //     if (paginationOptions.sort_by) {
    //       const validSortValue = ['created', 'farm_name', 'status', 'distance'];
    //       if (!validSortValue.includes(paginationOptions.sort_by)) {
    //         throw new BadRequestException('Cột sắp xếp không hợp lệ.');
    //       }
    //       const order = (paginationOptions.order || 'ASC') as 'ASC' | 'DESC';
    //       switch (paginationOptions.sort_by) {
    //         case 'name':
    //           qb.orderBy('farm.farm_name', order);
    //           break;
    //         case 'created':
    //           qb.orderBy('farm.created', order);
    //           break;
    //         case 'distance':
    //           qb.orderBy('distance', order);
    //         default:
    //           qb.orderBy('farm.farm_name', 'ASC');
    //       }
    //     } else {
    //       qb.orderBy(
    //         'farm.farm_name',
    //         (paginationOptions.order || 'ASC') as 'ASC' | 'DESC',
    //       );
    //     }

    //     // If all=true, return all results without pagination
    //     if (paginationOptions.all) {
    //       const farms = await qb.getMany();
    //       if (!farms || farms.length === 0) {
    //         this.logger.error('Không tìm thấy danh mục nào.');
    //         throw new NotFoundException('Không tìm thấy danh mục nào.');
    //       }
    //       return new PaginationResult(farms);
    //     }

    //     // Apply pagination
    //     const totalItems = await qb.getCount();

    //     const totalPages = Math.ceil(totalItems / (paginationOptions.limit ?? 10));
    //     const currentPage = paginationOptions.page ?? 1;

    //     if (totalPages > 0 && currentPage > totalPages) {
    //       throw new NotFoundException(
    //         `Không tìm thấy dữ liệu ở trang ${currentPage}.`,
    //       );
    //     }

    //     const farms = await qb
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
