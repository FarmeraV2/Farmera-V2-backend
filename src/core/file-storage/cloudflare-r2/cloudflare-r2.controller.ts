import { Body, Controller, Get, Post } from '@nestjs/common';
import { CloudflareR2Service } from './cloudflare-r2.service';
import { GetSignedUrlDto } from '../dtos/get-signed-url.dto';

@Controller('cloudflare-r2')
export class CloudflareR2Controller {

    constructor(private readonly cloudflareR2Service: CloudflareR2Service) { }

    @Post("signed-url/get")
    async getGetSignedUrl(@Body() getDto: GetSignedUrlDto) {
        return await this.cloudflareR2Service.getGetSignedUrl(getDto.key)
    }

    @Post("signed-url/put")
    async getPutSignedUrl(@Body() getDto: GetSignedUrlDto) {
        return await this.cloudflareR2Service.getPutSignedUrl(getDto.key)
    }

}
