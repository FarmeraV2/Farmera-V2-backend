import { BadRequestException, HttpException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Template } from '../entities/template.entity';
import { CreateTemplateDto } from '../dtos/template/create-template.dto';
import { ResponseCode } from 'src/common/constants/response-code.const';
import { UpdateTemplateDto } from '../dtos/template/update-template.dto';
import { GetTemplateDto } from '../dtos/template/get-template.dto';
import { PaginationResult } from 'src/common/dtos/pagination/pagination-result.dto';
import { plainToInstance } from 'class-transformer';
import { PaginationOptions, PaginationTransform } from 'src/common/dtos/pagination/pagination-option.dto';
import { TemplateSortField } from '../enums/template-sort-fields.enum';
import { applyPagination } from 'src/common/utils/pagination.util';
import { PaginationMeta } from 'src/common/dtos/pagination/pagination-meta.dto';

@Injectable()
export class TemplateService {

    private readonly logger = new Logger(TemplateService.name);

    constructor(@InjectRepository(Template) private templateRepository: Repository<Template>) { }

    async createTemplate(createTemplateDto: CreateTemplateDto, userId: number): Promise<Template> {
        try {
            return await this.templateRepository.save({ ...createTemplateDto, created_by: userId, updated_by: userId })
        }
        catch (error) {
            this.logger.error("Failed to create template: ", error.message);
            throw new InternalServerErrorException({
                message: "Failed to create template",
                code: ResponseCode.FAILED_TO_CREATE_TEMPLATE
            })
        }
    }

    async updateTemplate(templateId: number, updateTemplateDto: UpdateTemplateDto, userId: number): Promise<Template> {
        try {
            const result = await this.templateRepository.update(templateId, { ...updateTemplateDto, updated_by: userId })
            if (result.affected && result.affected > 0) {
                const template = await this.templateRepository.findOne({ where: { template_id: templateId } })
                if (!template) {
                    throw new InternalServerErrorException({
                        message: "Template is updated but can not be not found",
                        code: ResponseCode.INTERNAL_ERROR
                    })
                }
                return template;
            }
            throw new InternalServerErrorException({
                message: "Failed to update template",
                code: ResponseCode.FAILED_TO_UPDATE_TEMPLATE
            })
        }
        catch (error) {
            if (error instanceof HttpException) throw error;

            this.logger.error("Failed to update template: ", error.message);
            throw new InternalServerErrorException({
                message: "Failed to create template",
                code: ResponseCode.FAILED_TO_UPDATE_TEMPLATE
            })
        }
    }

    async deleteTemplate(templateId: number, userId: number): Promise<boolean> {
        try {
            const result = await this.templateRepository.update(templateId, { is_deleted: true, updated_by: userId });
            if (result.affected && result.affected > 0) {
                return true;
            }
            return false;
        }
        catch (error) {
            throw new InternalServerErrorException({
                message: "Failed to delete template",
                code: ResponseCode.FAILED_TO_DELETE_TEMPLATE,
            })
        }
    }

    async getTemplates(getTemplateDto: GetTemplateDto): Promise<PaginationResult<Template>> {
        const paginationOptions = plainToInstance(PaginationTransform<TemplateSortField>, getTemplateDto);
        const { sort_by, order } = paginationOptions;
        const { search } = getTemplateDto;
        try {
            const queryBuilder = this.templateRepository.createQueryBuilder('template')
                .andWhere('template.is_deleted = false');

            if (search) {
                queryBuilder.andWhere('template.template_name ILIKE :search', { search: `%${search.trim()}%` });
            }

            if (sort_by || order) {
                switch (sort_by) {
                    case TemplateSortField.NAME:
                        queryBuilder.orderBy('template.name', order);
                    default:
                        queryBuilder.orderBy('template.template_id', order);
                }
            }

            const totalItems = await applyPagination(queryBuilder, paginationOptions);
            const templates = await queryBuilder.getMany()
            return new PaginationResult(templates, new PaginationMeta({
                paginationOptions,
                totalItems
            }));
        }
        catch (error) {
            if (error instanceof HttpException) throw error;
            this.logger.error("Failed to get templates: ", error.message);
            throw new InternalServerErrorException({
                message: "Failed to get templates",
                code: ResponseCode.FAILED_TO_GET_TEMPLATE
            })
        }
    }
}
