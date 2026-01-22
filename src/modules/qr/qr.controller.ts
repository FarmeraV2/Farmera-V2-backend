import { Body, Controller, Get, Param, Patch, Post, Res } from '@nestjs/common';
import { QrService } from './qr.service';
import { Response } from "express";
import { UserInterface } from 'src/common/types/user.interface';
import { VerifyQrDto } from './dtos/verify-qr.dto';
import { User } from 'src/common/decorators/user.decorator';
import { UserRole } from 'src/common/enums/role.enum';
import { UpdateQrDto } from './dtos/update-qr.dto';
import { Roles } from 'src/common/decorators/role.decorator';

@Controller('qr')
export class QrController {
    constructor(private readonly qrService: QrService) { }

    @Roles([UserRole.FARMER, UserRole.ADMIN])
    @Get("product/:productId")
    async getProductQrs(@Param("productId") productId: number) {
        return this.qrService.getProductQrs(productId);
    }

    @Get(':token/image')
    async getQrImage(@Param('token') token: string, @Res() res: Response) {
        const buffer = await this.qrService.generateQrPng(token);

        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'no-store');
        res.send(buffer);
    }

    @Get(':token/base64')
    async getQrBase64(@Param('token') token: string) {
        return await this.qrService.generateQrBase64(token);
    }

    @Roles([UserRole.FARMER])
    @Patch()
    async updateQr(@Body() updateDto: UpdateQrDto) {
        return await this.qrService.updateQr(updateDto);
    }

    @Post()
    async verifyQr(@User() user: UserInterface, @Body() verifyDto: VerifyQrDto) {
        if (user.role == UserRole.FARMER) {
            return await this.qrService.activate(verifyDto);
        }
        else {
            return await this.qrService.verify(verifyDto);
        }
    }
}
