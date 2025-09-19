import { BadRequestException, Injectable, InternalServerErrorException, Logger, UnauthorizedException } from '@nestjs/common';
import { UserService } from 'src/modules/user/user/user.service';
import { CreateUserDto } from 'src/modules/user/dtos/user/create-user.dto';
import { UserDto } from 'src/modules/user/dtos/user/user.dto';
import { LoginDto } from '../dtos/login.dto';
import { UserStatus } from 'src/modules/user/enums/user-status.enum';
import { JsonWebTokenError, JwtService, TokenExpiredError } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import ms from 'ms';
import { ForgotPasswordDto, UpdateNewPasswordDto } from '../dtos/forgot-password.dto';
import { VerificationService } from '../verification/verification.service';

export const REFRESH_TOKEN_COOKIES_KEY = 'refresh_token';

@Injectable()
export class AuthService {

    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly verificationService: VerificationService,
    ) { }

    async register(registerDto: CreateUserDto): Promise<UserDto> {
        return await this.userService.createUser(registerDto);
    }

    /**
     * @function login - Authenticates a user and generates JWT access and refresh tokens
     * @param {LoginDto} req - The login request data 
     * @param {Response} res - The HTTP response object, used to set the refresh token cookie
     *
     * @returns {Promise<object>} - Returns an object containing:
     *  - `access_token`: Short-lived JWT for API access.
     *  - `refresh_token`: Long-lived JWT for refreshing access tokens.
     *  - `user`: Basic user details for the frontend.
     *
     * @throws {UnauthorizedException} - If the user account is banned.
     * @throws {InternalServerErrorException} - If authentication fails unexpectedly.
     * @throws {BadRequestException} - If the credentials are invalid (no matching user or incorrect password).
     */
    async login(req: LoginDto, res: Response): Promise<object> {
        try {
            const user = await this.userService.validateUser(req.password, req.email, req.phone);

            if (user) {
                const { uuid, email, phone, first_name, last_name, role, status, avatar } = user;
                const payload = { uuid, email, phone, first_name, last_name, role, status, avatar };

                if (status === UserStatus.BANNED) {
                    throw new UnauthorizedException('Your account is banned');
                }

                const accessToken = this.jwtService.sign(payload, {
                    secret: this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
                    expiresIn: this.configService.get<string>(
                        'JWT_ACCESS_TOKEN_EXPIRATION',
                    ),
                });

                const refreshToken = await this.createRefreshToken({
                    ...payload,
                    sub: 'token refresh',
                    iss: 'from server',
                });

                // Only set cookies if we're in an HTTP context (res.cookie exists)
                if (res && typeof res.cookie === 'function') {
                    const expirationSetting = this.configService.get<string>(
                        'JWT_REFRESH_TOKEN_EXPIRATION',
                    );

                    res.cookie(REFRESH_TOKEN_COOKIES_KEY, refreshToken, {
                        httpOnly: false,
                        maxAge: ms(expirationSetting as ms.StringValue),
                        sameSite: 'none',
                        secure: true,
                    });
                }

                return {
                    access_token: accessToken,
                    refresh_token: refreshToken,
                    user: payload
                };
            }
            throw new InternalServerErrorException("Failed to login user");
        } catch (error) {
            this.logger.error(error.message);
            throw error;
        }
    }

    /**
     * @function refreshToken - Verifies a refresh token and issues new access and refresh tokens
     * @param {string} refreshToken - The refresh token
     * @param {Response} res - The HTTP response object, used to update the refresh token cookie
     *
     * @returns {Promise<object>} - Returns an object containing:
     *  - `access_token`: New short-lived JWT for API access
     *  - `refresh_token`: New long-lived JWT for refreshing access tokens
     *  - `user`: Basic user details
     *
     * @throws {UnauthorizedException} - If the refresh token is expired or invalid
     * @throws {BadRequestException} - If the token does not correspond to a valid user
     * @throws {InternalServerErrorException} - If an unexpected error occurs during token verification or generation
     */

    async refreshToken(refreshToken: string, res: Response): Promise<object> {
        let userDecoded: UserDto;
        // verify token
        try {
            userDecoded = this.jwtService.verify<UserDto>(refreshToken, {
                secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
            });
        }
        catch (error) {
            this.logger.error(error.message);
            if (error instanceof TokenExpiredError) {
                throw new UnauthorizedException('Refresh token expired');
            } else if (error instanceof JsonWebTokenError) {
                throw new UnauthorizedException('Invalid refresh token');
            }
            throw new InternalServerErrorException('Failed to verify token');
        }

        // generate new tokens
        try {
            const user = await this.userService.getUserById(userDecoded.uuid);

            if (user) {
                const payload = {
                    uuid: user.uuid,
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    phone: user.phone,
                    role: user.role,
                    status: user.status,
                    avatar: user.avatar,
                };

                const newAccessToken = this.jwtService.sign(payload, {
                    secret: this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
                    expiresIn: this.configService.get<string>(
                        'JWT_ACCESS_TOKEN_EXPIRATION',
                    ),
                });

                const newRefreshToken = await this.createRefreshToken({
                    ...payload,
                    sub: 'token refresh',
                    iss: 'from server',
                });

                // Only manipulate cookies if we're in an HTTP context (res.cookie exists)
                if (res && typeof res.cookie === 'function') {
                    res.clearCookie(REFRESH_TOKEN_COOKIES_KEY);

                    const expirationSetting = this.configService.get<string>(
                        'JWT_REFRESH_TOKEN_EXPIRATION',
                    );

                    res.cookie(REFRESH_TOKEN_COOKIES_KEY, newRefreshToken, {
                        httpOnly: false, // Consider setting this to true for refresh tokens if possible
                        maxAge: ms(expirationSetting as ms.StringValue), // Type assertion here
                        sameSite: 'none',
                        secure: true,
                    });
                }

                return {
                    access_token: newAccessToken,
                    refresh_token: newRefreshToken,
                    user: payload,
                };
            } else {
                throw new BadRequestException('Refresh token is invalid or expired');
            }
        } catch (error) {
            if (error instanceof BadRequestException) throw error;
            this.logger.error(error.message);
            throw new InternalServerErrorException("Failed to process refresh token");
        }
    }

    /**
     * @function forgotPassword - Initiates the password reset process by sending a verification email
     * @param {ForgotPasswordDto} req - DTO containing the user's email
     *
     * @returns {Promise<boolean>} - Resolves to true if verification email has been sent
     *
     * @throws {BadRequestException} - If the user with the given email does not exist
     * @throws {BadRequestException} - If the maximum number of verification codes has been reached for the day
     */
    async forgotPassword(req: ForgotPasswordDto): Promise<boolean> {
        const { email, phone } = req;

        if (email) {
            await this.verificationService.sendVerificationEmail({ email }, true);
        }
        else if (phone) {
            await this.verificationService.sendVerificationPhone({ phone }, true);
        }

        return true;
    }

    /**
     * @function updateNewPassword - Verifies a user's code and updates their password
     * @param {UpdateNewPasswordDto} req - DTO containing email or phone, new password, and verification code
     *
     * @returns {Promise<boolean>} - Returns true if the password is updated successfully
     *
     * @throws {BadRequestException} - If the verification code is invalid
     * @throws {InternalServerErrorException} - If updating the password fails internally
     */
    async updateNewPassword(req: UpdateNewPasswordDto): Promise<boolean> {
        const { email, phone, newPassword } = req;

        // verify code
        let verification: { result: string } | undefined;
        if (email) {
            verification = await this.verificationService.verifyEmail({ email, verification_code: req.code });
        }
        else if (phone) {
            verification = await this.verificationService.verifyPhone({ phone, verification_code: req.code });
        }

        if (!verification) {
            throw new BadRequestException('Invalid verification code');
        }

        // update password
        await this.userService.updateUserPassword(newPassword, email, phone);

        return true;
    }

    /*#########################################################################
                                    Private                                  
    #########################################################################*/
    private async createRefreshToken(
        payload: Record<
            string,
            string | number | boolean | object | undefined | null | Array<any>
        >,
    ) {
        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
            expiresIn: this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRATION'),
        });

        return refreshToken;
    }

    /*#########################################################################
                                   Deprecated                                
    #########################################################################*/
    // public handleAuthErrors(err: any, user: any, request: Request): void {
    //     if (
    //         this.isAccessTokenExpired(err, user) &&
    //         this.isRefreshTokenAvailable(request)
    //     ) {
    //         const userDecode = this.jwtService.verify(
    //             request.cookies?.[REFRESH_TOKEN_COOKIES_KEY],
    //             {
    //                 secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
    //             },
    //         );
    //         return userDecode;
    //         // throw new TokenExpiredException();
    //     } else if (
    //         this.isAccessTokenExpired(err, user) &&
    //         !this.isRefreshTokenAvailable(request)
    //     ) {
    //         throw new UnauthorizedException('Please login');
    //     }
    // }

    // private isAccessTokenExpired(err: any, user: any): boolean {
    //     return Boolean(err) || !user;
    // }

    // private isRefreshTokenAvailable(request: Request): boolean {
    //     return Boolean(request.cookies?.[REFRESH_TOKEN_COOKIES_KEY]);
    // }
}
