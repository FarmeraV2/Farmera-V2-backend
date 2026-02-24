import { Controller, MaxFileSizeValidator, ParseFilePipe, Post, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { PinataService } from './pinata.service';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('pinata')
export class PinataController {

    constructor(private readonly pinataService: PinataService) { }

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
        ) files: Express.Multer.File[]
    ) {
        return await this.pinataService.uploadMutipleFiles(files);
    }
}
