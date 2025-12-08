import { BadRequestException, ConflictException, HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Verification } from '../entities/verification.entity';
import { SendVerificationEmailDto, SendVerificationPhoneDto, VerifyEmailDto, VerifyPhoneDto } from '../dtos/verification.dto';
import { Cron } from '@nestjs/schedule';
import { UserService } from 'src/modules/user/user/user.service';
import { VerifyService } from 'src/core/twilio/verify/verify.service';
import { CheckStatus } from 'src/core/twilio/enums/check-status.enum';
import { ResponseCode } from 'src/common/constants/response-code.const';
import { toInternationalPhone } from 'src/utils/phone';

@Injectable()
export class VerificationService {
    private readonly logger = new Logger(VerificationService.name);

    constructor(
        @InjectRepository(Verification) private verificationRepository: Repository<Verification>,
        private userService: UserService,
        private verifyService: VerifyService,
    ) { }

    /**
     * @function sendVerificationEmail - Sends a verification email for registration or password reset
     * @param {SendVerificationEmailDto} sendVerificationEmailDto - The DTO containing the user's email
     * @param {boolean} [forgotPassword=false] - Flag indicating if this is for password reset (true) or registration (false)
     *
     * @returns {Promise<{result: string}>} - Returns an object containing:
     *  - `result`: 'Success' if the email verification record is created/updated and the email send process is triggered
     *
     * @throws {ConflictException} - If the email is already in use during registration (`EMAIL_CONFLICT`)
     * @throws {BadRequestException} - If the user is not found during password reset (`USER_NOT_FOUND`)
     * @throws {BadRequestException} - If the maximum number of verification codes (5) has been reached (`MAX_ATTEMPTS_REACHED`)
     * @throws {InternalServerErrorException} - If an unexpected error occurs while sending the verification email (`INTERNAL_ERROR`)
     */
    async sendVerificationEmail(sendVerificationEmailDto: SendVerificationEmailDto, forgotPassword: boolean = false): Promise<{ result: string }> {
        try {
            // find a user with email & validate
            const foundUser = await this.userService.userExistsBy('email', sendVerificationEmailDto.email);

            if (!forgotPassword && foundUser) {
                throw new ConflictException({
                    message: 'This email is already in use',
                    code: ResponseCode.EMAIL_CONFLICT
                });
            }

            if (forgotPassword && !foundUser) {
                throw new BadRequestException({
                    message: 'User not found',
                    code: ResponseCode.USER_NOT_FOUND
                });
            }

            const foundVerification = await this.verificationRepository.findOne({
                where: { email: sendVerificationEmailDto.email },
            });

            // if verfication is found, increase count and send an email
            if (foundVerification) {
                if (foundVerification.email_code_count >= 5) {
                    throw new BadRequestException({
                        message: 'You have reached the maximum verification code sent limit, please try again tomorrow or contact the Farmera team',
                        code: ResponseCode.MAX_ATTEMPTS_REACHED
                    });
                }

                foundVerification.email_code_count += 1;
                foundVerification.updated_at = new Date();

                await this.verificationRepository.save(foundVerification);

                setTimeout(() => {
                    void (async () => {
                        if (!forgotPassword) {
                            await this.verifyService.createEmailVerification(sendVerificationEmailDto.email);
                        } else {
                            await this.verifyService.createEmailVerification(sendVerificationEmailDto.email);
                        }
                    })();
                }, 0);
            }
            // create new verification and send email
            else {
                const newVerification = this.verificationRepository.create({
                    ...sendVerificationEmailDto,
                    email_code_count: 1,
                    created_at: new Date(),
                    updated_at: new Date(),
                });

                await this.verificationRepository.save(newVerification);

                setTimeout(() => {
                    void (async () => {
                        if (!forgotPassword) {
                            await this.verifyService.createEmailVerification(sendVerificationEmailDto.email);
                        } else {
                            await this.verifyService.createEmailVerification(sendVerificationEmailDto.email);
                        }
                    })();
                }, 0);
            }

            return {
                result: 'Success',
            };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException({
                message: "Failed to send verification email",
                code: ResponseCode.INTERNAL_ERROR,
            })
        }
    }

    /**
     * @function verifyEmail - Verifies the email using a verification code
     * @param {VerifyEmailDto} verifyEmailDto - Contains email + verification code
     *
     * @returns {Promise<CheckStatus>} - Verification status
     *
     * @throws {VERIFICATION_FAILED} - If verification update fails or unexpected error occurs (`VERIFICATION_FAILED`)
     */
    async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<{ status: CheckStatus }> {
        try {
            const status = await this.verifyService.createEmailVerificationCheck(verifyEmailDto.verification_code, verifyEmailDto.email);
            const result = await this.verificationRepository.createQueryBuilder()
                .update(Verification)
                .set({ status: status })
                .where('email = :email', { email: verifyEmailDto.email })
                .execute();
            if (result && result.affected && result.affected <= 0) {
                throw new InternalServerErrorException();
            }
            return { status };
        } catch (error) {
            throw new InternalServerErrorException({
                message: "Failed to verify email",
                code: ResponseCode.VERIFICATION_FAILED,
            })
        }
    }

    /**
     * @function sendVerificationPhone - Sends SMS verification for registration or password reset
     * @param {SendVerificationPhoneDto} sendVerificationPhoneDto - DTO containing phone number
     * @param {boolean} [forgotPassword=false] - Whether SMS is for password reset
     *
     * @returns {Promise<{result: string}>} - 'Success' if verification SMS is triggered
     *
     * @throws {ConflictException} - If the phone number is already in use (`PHONE_CONFLICT`)
     * @throws {BadRequestException} - If user not found during password reset (`USER_NOT_FOUND`)
     * @throws {BadRequestException} - If max verification attempts (5) reached (`MAX_ATTEMPTS_REACHED`)
     * @throws {InternalServerErrorException} - Unexpected failures (`INTERNAL_ERROR`)
     */
    async sendVerificationPhone(sendVerificationPhoneDto: SendVerificationPhoneDto, forgotPassword = false) {
        let phone = sendVerificationPhoneDto.phone;
        if (!phone.includes('+')) {
            phone = toInternationalPhone(phone);
        }

        const foundUser = await this.userService.userExistsBy('phone', phone);

        if (!forgotPassword && foundUser) {
            throw new ConflictException('This phone is already in use');
        }

        if (forgotPassword && !foundUser) {
            throw new BadRequestException('User not found');
        }

        const foundVerification = await this.verificationRepository.findOne({
            where: { phone },
        });

        if (foundVerification && foundVerification.phone) {
            if (foundVerification.email_code_count >= 5) {
                throw new BadRequestException({
                    message: 'You have reached the maximum verification code sent limit, please try again tomorrow or contact the Farmera team',
                    code: ResponseCode.MAX_ATTEMPTS_REACHED,
                });
            }

            foundVerification.email_code_count += 1;
            foundVerification.updated_at = new Date();

            await this.verificationRepository.save(foundVerification);

            setTimeout(() => {
                void (async () => {
                    if (!forgotPassword) {
                        await this.verifyService.createSmsVerification(phone);
                    } else {
                        await this.verifyService.createSmsVerification(phone);
                    }
                })();
            }, 0);
        }
        // create new verification and send email
        else {
            const newVerification = this.verificationRepository.create({
                ...sendVerificationPhoneDto,
                email_code_count: 1,
                created_at: new Date(),
                updated_at: new Date(),
            });

            await this.verificationRepository.save(newVerification);

            setTimeout(() => {
                void (async () => {
                    if (!forgotPassword) {
                        await this.verifyService.createSmsVerification(phone);
                    } else {
                        await this.verifyService.createSmsVerification(phone);
                    }
                })();
            }, 0);
        }

        return {
            result: 'Success',
        };
    }


    /**
     * @function verifyPhone - Verifies the phone using a verification code
     * @param {VerifyPhoneDto} verifyPhoneDto - Contains phone + verification code
     *
     * @returns {Promise<CheckStatus>} - Verification status
     *
     * @throws {VERIFICATION_FAILED} - If verification update fails or unexpected error occurs (`VERIFICATION_FAILED`)
     */
    async verifyPhone(verifyPhoneDto: VerifyPhoneDto): Promise<{ status: CheckStatus }> {
        try {
            let phone = verifyPhoneDto.phone;
            if (!phone.includes('+')) {
                phone = toInternationalPhone(phone);
            }
            const status = await this.verifyService.createSmsVerificationCheck(verifyPhoneDto.verification_code, phone);
            const result = await this.verificationRepository.createQueryBuilder()
                .update(Verification)
                .set({ status: status })
                .where('phone = :phone', { phone })
                .execute();
            if (result && result.affected && result.affected <= 0) {
                throw new InternalServerErrorException();
            }
            this.logger.log(`Phone verification status: ${status}`);
            return { status };
        } catch (error) {
            throw new InternalServerErrorException({
                message: "Failed to verify phone",
                code: ResponseCode.INTERNAL_ERROR,
            })
        }
    }

    async checkVerify(email: string, phone: string): Promise<void> {
        try {
            phone = toInternationalPhone(phone);
            const record = await this.verificationRepository.createQueryBuilder("verification")
                .where("verification.email = :email OR verification.phone = :phone", { email: email, phone: phone })
                .getOne();

            if (!record) {
                throw new NotFoundException({
                    message: "verification not found",
                    code: ResponseCode.VERIFICATION_NOT_FOUND,
                })
            }
            if (record.status !== CheckStatus.APPROVED) {
                throw new BadRequestException({
                    message: "Verification failed",
                    code: ResponseCode.VERIFICATION_FAILED
                })
            }
        }
        catch (error) {
            if (error instanceof HttpException) throw error;
            this.logger.error("Failed to get verificiation: ", error.message);
            throw new InternalServerErrorException({
                message: "Failed to get verification",
                code: ResponseCode.INTERNAL_ERROR,
            })
        }
    }

    /*#########################################################################
                                    Cron job                                 
    #########################################################################*/

    @Cron('0 0 * * *')
    async handleCleanupCron() {
        this.logger.log('Running daily verification cleanup cron job');
        try {
            await this.deleteAllVerifications();
            this.logger.log('Successfully cleaned up all verifications');
        } catch (error) {
            this.logger.error('Failed to clean up verifications:', error);
        }
    }

    private async deleteAllVerifications() {
        await this.verificationRepository.delete({});
    }

    /*#########################################################################
                                   Deprecated                                
    #########################################################################*/

    // private async deleteVerification(email: string) {
    //     await this.verificationRepository.delete({ email });
    // }

    // private async deletePhoneVerification(phoneNumber: string) {
    //     await this.verificationRepository.delete({ phone: phoneNumber });
    // }

    // async sendVerificationPhone(sendVerificationPhoneDto: SendVerificationPhoneDto, forgotPassword = false) {
    //     const phone = sendVerificationPhoneDto.phone;

    //     const foundUser = await this.userService.userExistsBy('phone', phone);

    //     if (!forgotPassword && foundUser) {
    //         throw new ConflictException('This phone number is already in use');
    //     }

    //     if (forgotPassword && !foundUser) {
    //         throw new BadRequestException('User not found');
    //     }

    //     const foundVerification = await this.verificationRepository.findOne({
    //         where: { phone },
    //     });

    //     if (foundVerification) {
    //         if (foundVerification.phone_code_count >= 5) {
    //             throw new BadRequestException(
    //                 'You have reached the maximum verification code sent limit, please try again tomorrow or contact the Farmera team',
    //             );
    //         }

    //         foundVerification.phone_code = this.generateFourDigitCode();
    //         foundVerification.phone_code_count += 1;
    //         foundVerification.updated_at = new Date();

    //         await this.verificationRepository.save(foundVerification);

    //         setTimeout(() => {
    //             void (async () => {
    //                 if (!forgotPassword) {
    //                     await this.sendPhoneCode(phone, foundVerification.phone_code);
    //                 } else {
    //                     await this.sendPhoneResetCode(phone, foundVerification.phone_code);
    //                 }
    //             })();
    //         }, 0);
    //     } else {
    //         const newVerification = this.verificationRepository.create({
    //             phone,
    //             phone_code: this.generateFourDigitCode(),
    //             phone_code_count: 1,
    //             created_at: new Date(),
    //             updated_at: new Date(),
    //         });

    //         await this.verificationRepository.save(newVerification);

    //         setTimeout(() => {
    //             void (async () => {
    //                 if (!forgotPassword) {
    //                     await this.sendPhoneCode(phone, newVerification.phone_code);
    //                 } else {
    //                     await this.sendPhoneResetCode(phone, newVerification.phone_code);
    //                 }
    //             })();
    //         }, 0);
    //     }

    //     return {
    //         result: 'Success',
    //     };
    // }

    // private async sendPhoneCode(phoneNumber: string, code: string) {
    //     try {
    //         await this.smsService.sendVerificationCode(phoneNumber, code);
    //     } catch {
    //         throw new BadRequestException('Failed to send SMS verification code');
    //     }
    // }

    // private async sendPhoneResetCode(phoneNumber: string, code: string) {
    //     try {
    //         await this.smsService.sendPasswordResetCode(phoneNumber, code);
    //     } catch {
    //         throw new BadRequestException('Failed to send SMS reset code');
    //     }
    // }

    // private async sendEmailCode(email: string, code: string): Promise<boolean> {
    //     const subject = 'Your Verification Code';
    //     const text = `Hi,

    //         Please use the code below to verify your email:
    //         ${code}

    //         Please let us know if you have any questions or need assistance at support@farmeravietnam.com.

    //         Best regards,
    //         Farmera Team`;

    //     const html = `
    //         <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    //         <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
    //             <h2 style="text-align: center; color: #034460;">Email Verification</h2>
    //             <p>Hi,</p>
    //             <p>Please use the code below to verify your email:</p>
    //             <div style="text-align: center; margin: 20px 0;">
    //             <span style="font-size: 24px; font-weight: bold; color: #333; background-color: #f9f9f9; padding: 10px 20px; border: 1px solid #ddd; border-radius: 5px;">${code}</span>
    //             </div>
    //             <p>Please let us know if you have any questions or need assistance at support@farmeravietnam.com.</p>
    //             <p style="text-align: right;">Best regards,<br>Farmera Team</p>
    //         </div>
    //         </div>
    //         `;

    //     return await this.emailService.sendEmail(email, subject, text, html);
    // }

    // private async sendEmailResetCode(email: string, code: string) {
    //     const subject = 'Your Password Reset Code';
    //     const text = `Hi,

    // Please use the code below to reset your password:
    // ${code}

    // Please let us know if you have any questions or need assistance at support@farmeravietnam.com.

    // Best regards,
    // Farmera Team`;

    //     const html = `
    // <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    //   <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
    //     <h2 style="text-align: center; color: #034460;">Password Reset</h2>
    //     <p>Hi,</p>
    //     <p>Please use the code below to reset your password:</p>
    //     <div style="text-align: center; margin: 20px 0;">
    //       <span style="font-size: 24px; font-weight: bold; color: #333; background-color: #f9f9f9; padding: 10px 20px; border: 1px solid #ddd; border-radius: 5px;">${code}</span>
    //     </div>
    //     <p>Please let us know if you have any questions or need assistance at support@farmeravietnam.com.</p>
    //     <p style="text-align: right;">Best regards,<br>Farmera Team</p>
    //   </div>
    // </div>
    // `;

    //     await this.emailService.sendEmail(email, subject, text, html);
    // }

    /**
     * @function sendVerificationEmail - Sends a verification email for registration or password reset
     * @param {SendVerificationEmailDto} sendVerificationEmailDto - The DTO containing the user's email
     * @param {boolean} [forgotPassword=false] - Flag indicating if this is for password reset (true) or registration (false)
     *
     * @returns {Promise<{result: string}>} - Returns an object containing:
     *  - `result`: 'Success' if the email is sent or verification record is created/updated successfully
     *
     * @throws {ConflictException} - If the email is already in use during registration
     * @throws {BadRequestException} - If the user is not found during password reset
     * @throws {BadRequestException} - If the maximum number of verification codes (5) has been reached
     */
    // async sendVerificationEmail(sendVerificationEmailDto: SendVerificationEmailDto, forgotPassword: boolean = false): Promise<{ result: string }> {
    //     // find a user with email & validate
    //     const foundUser = await this.userService.userExistsBy('email', sendVerificationEmailDto.email);

    //     if (!forgotPassword && foundUser) {
    //         throw new ConflictException('This email is already in use');
    //     }

    //     if (forgotPassword && !foundUser) {
    //         throw new BadRequestException('User not found');
    //     }

    //     const foundVerification = await this.verificationRepository.findOne({
    //         where: { email: sendVerificationEmailDto.email },
    //     });

    //     // if verfication is found, increase count and send an email
    //     if (foundVerification) {
    //         if (foundVerification.email_code_count >= 5) {
    //             throw new BadRequestException(
    //                 'You have reached the maximum verification code sent limit, please try again tomorrow or contact the Farmera team',
    //             );
    //         }

    //         foundVerification.email_code = this.generateFourDigitCode();
    //         foundVerification.email_code_count += 1;
    //         foundVerification.updated_at = new Date();

    //         await this.verificationRepository.save(foundVerification);

    //         setTimeout(() => {
    //             void (async () => {
    //                 if (!forgotPassword) {
    //                     await this.sendEmailCode(sendVerificationEmailDto.email, foundVerification.email_code);
    //                 } else {
    //                     await this.sendEmailResetCode(sendVerificationEmailDto.email, foundVerification.email_code);
    //                 }
    //             })();
    //         }, 0);
    //     }
    //     // create new verification and send email
    //     else {
    //         const newVerification = this.verificationRepository.create({
    //             ...sendVerificationEmailDto,
    //             email_code: this.generateFourDigitCode(),
    //             email_code_count: 1,
    //             created_at: new Date(),
    //             updated_at: new Date(),
    //         });

    //         await this.verificationRepository.save(newVerification);

    //         setTimeout(() => {
    //             void (async () => {
    //                 if (!forgotPassword) {
    //                     await this.sendEmailCode(sendVerificationEmailDto.email, newVerification.email_code);
    //                 } else {
    //                     await this.sendEmailResetCode(sendVerificationEmailDto.email, newVerification.email_code);
    //                 }
    //             })();
    //         }, 0);
    //     }

    //     return {
    //         result: 'Success',
    //     };
    // }

    // async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    //     const foundVerification = await this.verificationRepository.findOne({
    //         where: { email: verifyEmailDto.email },
    //     });

    //     if (!foundVerification) {
    //         throw new BadRequestException('Verification not found for this email');
    //     }

    //     if (foundVerification.email_code !== verifyEmailDto.verification_code) {
    //         throw new BadRequestException('Invalid verification code');
    //     }

    //     return {
    //         result: 'Success',
    //     };
    // }

    // private generateFourDigitCode() {
    //     return Math.floor(1000 + Math.random() * 9000).toString();
    // }
}
