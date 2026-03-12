import { Body, Controller, Post } from '@nestjs/common';
import { ImageVerificationService } from './image-verification.service';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('image-verification')
export class ImageVerificationController {

    constructor(private readonly imageVerificationService: ImageVerificationService) { }

    @Post('/test')
    async testVerificationImage(@Body() log: any) {
        return await this.imageVerificationService.verifyLogImages(log);
    }

    @Public()
    @Post('/analyze')
    async analyzeImages(@Body() body: { image_urls: string[] }) {
        return await this.imageVerificationService.analyzeImageUrls(body.image_urls);
    }

    @Public()
    @Post('/analyze-raw')
    async analyzeRaw(@Body() body: { image_urls: string[] }) {
        return await this.imageVerificationService.analyzeRaw(body.image_urls);
    }
}
