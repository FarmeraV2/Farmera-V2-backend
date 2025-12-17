import { Body, Controller, Get, Patch, Post, Req, Res } from '@nestjs/common';
import { AuthService, REFRESH_TOKEN_COOKIES_KEY } from './auth.service';
import { LoginDto } from '../dtos/login.dto';
import { CreateUserDto } from 'src/modules/user/dtos/user/create-user.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { Request, Response } from 'express';
import { UpdateNewPasswordDto } from '../dtos/forgot-password.dto';
import { Roles } from 'src/common/decorators/role.decorator';
import { UserRole } from 'src/common/enums/role.enum';
import { RefreshToken } from '../dtos/refresh-token.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Public()
    @Post('register')
    async register(@Body() req: CreateUserDto) {
        return await this.authService.register(req);
    }

    @Roles([UserRole.ADMIN])
    @Post('register')
    async registerAdmin(@Body() req: CreateUserDto) {
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
        const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIES_KEY] as string;
        return await this.authService.refreshToken(refreshToken, res);
    }

    @Public()
    @Post('refresh-token')
    async refreshTokenBody(@Res({ passthrough: true }) res: Response, @Body() body: RefreshToken) {
        return await this.authService.refreshToken(body.refresh_token, res);
    }

    @Public()
    @Patch('update-new-password')
    async updateNewPassword(@Body() req: UpdateNewPasswordDto) {
        return await this.authService.updateNewPassword(req);
    }
}
