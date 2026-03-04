import { Body, Controller, Delete, Get, HttpException, Inject, InternalServerErrorException, MaxFileSizeValidator, Param, ParseFilePipe, Post, Query, Res, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FileStorageService } from '../interfaces/file-storage.interface';
import { ResponseCode } from 'src/common/constants/response-code.const';
import { StoragePermission } from '../enums/storage-permission.enum';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UploadFileDto } from '../dtos/upload-file.dto';
import { Response } from "express";
import { Public } from 'src/common/decorators/public.decorator';

@Controller('file-storage')
export class FileStorageController {

    constructor(
        @Inject('FileStorageService') private readonly fileStorageService: FileStorageService
    ) { }

    @Post("signed-url/get")
    async getGetSignedUrl(@Body() getDto: UploadFileDto) {
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
    async getPutSignedUrl(@Body() getDto: UploadFileDto) {
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
                new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
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

    @Get('*url')
    @Public()
    async serveFile(@Param('url') url: string | string[], @Res() res: Response) {
        if (!this.fileStorageService.serveFile) {
            throw new InternalServerErrorException({
                message: "Invalid service",
                code: ResponseCode.INTERNAL_ERROR
            })
        }

        const filePath = Array.isArray(url) ? url.join('/') : url;

        try {
            const { buffer, filePath: absolutePath, isVideo, mimeType } = await this.fileStorageService.serveFile(filePath);

            res.setHeader('Content-Type', mimeType);
            res.setHeader('Accept-Ranges', 'bytes');
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

            if (buffer) {
                res.send(buffer);
            }
            // todo!("handle video")
            // else if (isVideo && absolutePath) {
            //     res.sendFile(absolutePath, { dotfiles: 'deny', acceptRanges: true }, (err) => {
            //         if (err && !res.headersSent) {
            //             res.status(500).json({
            //                 message: 'Error streaming file',
            //                 code: ResponseCode.INTERNAL_ERROR,
            //             });
            //         }
            //     });
            // }
            else {
                throw new InternalServerErrorException({
                    message: 'File could not be served',
                    code: ResponseCode.INTERNAL_ERROR,
                });
            }
        } catch (error) {
            if (error instanceof HttpException) throw error;

            throw new InternalServerErrorException({
                message: 'Failed to serve file',
                code: ResponseCode.INTERNAL_ERROR,
            });
        }
    }
}
