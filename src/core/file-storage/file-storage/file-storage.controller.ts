import { Body, Controller, Delete, Get, Inject, InternalServerErrorException, MaxFileSizeValidator, Param, ParseFilePipe, Post, Res, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FileStorageService } from '../interfaces/file-storage.interface';
import { GetSignedUrlDto } from '../dtos/get-signed-url.dto';
import { ResponseCode } from 'src/common/constants/response-code.const';
import { StoragePermission } from '../enums/storage-permission.enum';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UploadFileDto } from '../dtos/upload-file.dto';
import { getFileExtension } from '../utils/file.util';
import { Response } from "express";
import { lookup } from 'mime-types';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('file-storage')
export class FileStorageController {

    constructor(@Inject('FileStorageService') private readonly fileStorageService: FileStorageService) { }

    @Post("signed-url/get")
    async getGetSignedUrl(@Body() getDto: GetSignedUrlDto) {
        if (this.fileStorageService.getSignedUrl) {
            return await this.fileStorageService.getSignedUrl(getDto.key, StoragePermission.READ);
        } else {
            throw new InternalServerErrorException({
                message: "Invalid service",
                code: ResponseCode.INTERNAL_ERROR
            })
        }
    }

    @Post("signed-url/put")
    async getPutSignedUrl(@Body() getDto: GetSignedUrlDto) {
        if (this.fileStorageService.getSignedUrl) {
            return await this.fileStorageService.getSignedUrl(getDto.key, StoragePermission.WRITE);
        } else {
            throw new InternalServerErrorException({
                message: "Invalid service",
                code: ResponseCode.INTERNAL_ERROR
            })
        }
    }


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
        return await this.fileStorageService.uploadFile(files, uploadFileDto.group_type, uploadFileDto.sub_path)
    }

    @Delete("*url")
    async deleteFile(@Param("url") url: string | string[]) {
        if (this.fileStorageService.deleteByUrls) {
            const filePath = Array.isArray(url) ? url.join('/') : url;
            return await this.fileStorageService.deleteByUrls([filePath]);
        } else {
            throw new InternalServerErrorException({
                message: "Invalid service",
                code: ResponseCode.INTERNAL_ERROR
            })
        }
    }

    @Get("*url")
    @Public()
    async getFile(@Param("url") url: string | string[], @Res() res: Response) {
        if (this.fileStorageService.getFile) {
            const filePath = Array.isArray(url) ? url.join('/') : url;
            const fileBuffer = await this.fileStorageService.getFile(filePath);

            const ext = getFileExtension(filePath);
            const contentType = lookup(ext) || 'application/octet-stream';

            res.setHeader('Content-Type', contentType);
            res.send(fileBuffer);
        } else {
            throw new InternalServerErrorException({
                message: "Invalid service",
                code: ResponseCode.INTERNAL_ERROR
            })
        }
    }
}
