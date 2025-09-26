import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { AuthService, REFRESH_TOKEN_COOKIES_KEY } from './auth.service';
import { LoginDto } from '../dtos/login.dto';
import { CreateUserDto } from 'src/modules/user/dtos/user/create-user.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { Request, Response } from 'express';
import { ForgotPasswordDto, UpdateNewPasswordDto } from '../dtos/forgot-password.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Public()
    @Post('register')
    async register(@Body() req: CreateUserDto) {
        return await this.authService.register(req);
    }

    @Public()
    @Post('login')
    async login(@Body() req: LoginDto, @Res({ passthrough: true }) res: Response) {
        return await this.authService.login(req, res);
    }

    @Public()
    @Get('refresh-token')
    async refreshToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIES_KEY];
        return await this.authService.refreshToken(refreshToken, res);
    }

    @Public()
    @Post('forgot-password')
    async forgotPassword(@Body() req: ForgotPasswordDto) {
        return await this.authService.forgotPassword(req);
    }

    @Public()
    @Post('update-new-password')
    async updateNewPassword(@Body() req: UpdateNewPasswordDto) {
        return await this.authService.updateNewPassword(req);
    }
}
