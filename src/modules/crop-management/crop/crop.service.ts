import { HttpException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Crop } from '../entities/crop.entity';
import { Repository } from 'typeorm';
import { CropDto } from '../dtos/crop/crop.dto';
import { PaginationResult } from 'src/common/dtos/pagination/pagination-result.dto';
import { plainToInstance } from 'class-transformer';
import { PaginationTransform } from 'src/common/dtos/pagination/pagination-option.dto';
import { CropSortFields } from '../enums/crop-sort-fields.enum';
import { GetCropDto } from '../dtos/crop/get-crop.dto';
import { ResponseCode } from 'src/common/constants/response-code.const';
import { applyPagination } from 'src/common/utils/pagination.util';
import { PaginationMeta } from 'src/common/dtos/pagination/pagination-meta.dto';
import { CreateCropDto } from '../dtos/crop/create-crop.dto';

@Injectable()
export class CropService {
    private readonly logger = new Logger(CropService.name);

    constructor(@InjectRepository(Crop) private readonly cropRepository: Repository<Crop>) { }

    async getCrops(getCropsDto: GetCropDto): Promise<PaginationResult<CropDto>> {
        const paginationOptions = plainToInstance(PaginationTransform<CropSortFields>, getCropsDto)
        const { sort_by, order } = paginationOptions
        const { search, crop_type } = getCropsDto;
        try {
            const queryBuilder = this.cropRepository.createQueryBuilder("crop");

            if (search) {
                queryBuilder.andWhere("crop.name ILIKE :search", { search: `%${search.trim()}%` });
            }
            if (crop_type && crop_type.length > 0) {
                queryBuilder.andWhere("crop.crop_type IN (:...cropType)", { cropType: crop_type });
            }

            if (sort_by || order) {
                switch (sort_by) {
                    case CropSortFields.NAME:
                        queryBuilder.orderBy("crop.name", order);
                        break;
                    case CropSortFields.UPDATED:
                        queryBuilder.orderBy("crop.updated", order);
                        break;
                    default:
                        queryBuilder.orderBy("crop.id", order)
                }
            }

            const totalItems = await applyPagination(queryBuilder, getCropsDto);
            const crops = await queryBuilder.getMany();
            const meta = new PaginationMeta({ paginationOptions, totalItems });

            return new PaginationResult(plainToInstance(
                CropDto,
                crops.map((crop) => {
                    return {
                        ...crop,
                        image_url: crop.image_urls?.length ? crop.image_urls[0] : null
                    }
                }),
                { excludeExtraneousValues: true }
            ), meta);
        }
        catch (error) {
            if (error instanceof HttpException) throw error;
            this.logger.error("Failed to get crops: ", error.message);
            throw new InternalServerErrorException({
                message: "Failed to add log",
                code: ResponseCode.FAILED_TO_GET_CROPS
            })
        }
    }

    async createCrop(createCropDto: CreateCropDto): Promise<Crop> {
        try {
            const crop = this.cropRepository.create(createCropDto);
            return await this.cropRepository.save(crop);
        }
        catch (error) {
            this.logger.error("Failed to create crop: ", error.message);
            throw new InternalServerErrorException({
                message: "Failed to create crop",
                code: ResponseCode.FAILED_TO_CREATE_CROP
            })
        }
    }
}
