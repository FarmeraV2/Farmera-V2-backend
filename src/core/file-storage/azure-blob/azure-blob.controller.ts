import { Body, Controller, Post } from '@nestjs/common';
import { AzureBlobService } from './azure-blob.service';
import { StoragePermission } from '../enums/storage-permission.enum';
import { UploadFileDto } from '../dtos/upload-file.dto';

@Controller('azure-blob')
export class AzureBlobController {
    constructor(private readonly azureBlobService: AzureBlobService) { }

    @Post("signed-url/read")
    async getGetSignedUrl(@Body() getDto: UploadFileDto) {
        return await this.azureBlobService.generateSasUrl(getDto.key, StoragePermission.READ)
    }

    @Post("signed-url/write")
    async getPutSignedUrl(@Body() getDto: UploadFileDto) {
        return await this.azureBlobService.generateSasUrl(getDto.key, StoragePermission.WRITE)
    }
}
