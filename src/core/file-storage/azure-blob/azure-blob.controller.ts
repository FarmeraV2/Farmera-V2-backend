import { Body, Controller, Post } from '@nestjs/common';
import { AzureBlobService } from './azure-blob.service';
import { GetSignedUrlDto } from '../dtos/get-signed-url.dto';
import { StoragePermission } from '../enums/storage-permission.enum';

@Controller('azure-blob')
export class AzureBlobController {
    constructor(private readonly azureBlobService: AzureBlobService) { }

    @Post("signed-url/read")
    async getGetSignedUrl(@Body() getDto: GetSignedUrlDto) {
        return await this.azureBlobService.generateSasUrl(getDto.key, StoragePermission.READ)
    }

    @Post("signed-url/write")
    async getPutSignedUrl(@Body() getDto: GetSignedUrlDto) {
        return await this.azureBlobService.generateSasUrl(getDto.key, StoragePermission.WRITE)
    }
}
