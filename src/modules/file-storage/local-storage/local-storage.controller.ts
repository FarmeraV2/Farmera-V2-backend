import { Body, Controller, Delete, Get, MaxFileSizeValidator, Param, ParseFilePipe, Post, Res, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { LocalStorageService } from './local-storage.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UploadFileDto } from '../dtos/upload-file.dto';
import { Response } from "express";
import path from 'path';
import { lookup } from 'mime-types';

@Controller('local-storage')
export class LocalStorageController {

    constructor(private readonly localStorageService: LocalStorageService) { }

    @Post("upload")
    @UseInterceptors(FilesInterceptor("files"))
    async upload(
        @UploadedFiles(new ParseFilePipe({
            validators: [
                new MaxFileSizeValidator({ maxSize: 25 * 1024 * 1024 }), // 25MB
                // todo!("handle this error")
                // new FileTypeValidator({
                //     fileType:
                //         /^(image\/(jpeg|jpg|png|gif|webp|jfif)|video\/(mp4|webm)|application\/pdf)$/,
                // }),
            ],
        }),
        ) files: Express.Multer.File[], @Body() uploadFileDto: UploadFileDto
    ) {
        return await this.localStorageService.saveFiles(files, uploadFileDto.group_type, uploadFileDto.sub_path)
    }

    @Delete("*url")
    async deleteFile(@Param("url") url: string | string[]) {
        const filePath = Array.isArray(url) ? url.join('/') : url;
        return await this.localStorageService.deleteByUrls([filePath]);
    }

    @Get("*url")
    async getFile(@Param("url") url: string | string[], @Res() res: Response) {
        const filePath = Array.isArray(url) ? url.join('/') : url;
        const fileBuffer = await this.localStorageService.getFile(filePath);

        const ext = path.extname(filePath).toLowerCase();
        const contentType = lookup(ext) || 'application/octet-stream';

        res.setHeader('Content-Type', contentType);
        res.send(fileBuffer);
    }
}
