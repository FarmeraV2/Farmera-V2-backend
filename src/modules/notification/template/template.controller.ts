import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Roles } from 'src/common/decorators/role.decorator';
import { UserRole } from 'src/common/enums/role.enum';
import { TemplateService } from './template.service';
import { User } from 'src/common/decorators/user.decorator';
import { UserInterface } from 'src/common/types/user.interface';
import { CreateTemplateDto } from '../dtos/template/create-template.dto';
import { UpdateTemplateDto } from '../dtos/template/update-template.dto';
import { GetTemplateDto } from '../dtos/template/get-template.dto';

@Controller('template')
@Roles([UserRole.ADMIN])
export class TemplateController {

    constructor(private readonly templateService: TemplateService) { }

    @Post()
    async createTemplate(@User() user: UserInterface, @Body() createTemplateDto: CreateTemplateDto) {
        return await this.templateService.createTemplate(createTemplateDto, user.id);
    }

    @Patch(":id")
    async updateTemplate(@User() user: UserInterface, @Param("id") id: number, @Body() updateTemplateDto: UpdateTemplateDto) {
        return await this.templateService.updateTemplate(id, updateTemplateDto, user.id);
    }

    @Delete(":id")
    async deleteTemplate(@User() user: UserInterface, @Param("id") id: number) {
        return await this.templateService.deleteTemplate(id, user.id);
    }

    @Get()
    async getTemplates(@Query() getTemplateDto: GetTemplateDto) {
        return await this.templateService.getTemplates(getTemplateDto);
    }

}
