import { BadRequestException, ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Verification } from '../entities/verification.entity';
import { SmsService } from 'src/core/sms/sms.service';
import { MailService } from 'src/core/mail/mail.service';
import { SendVerificationEmailDto, SendVerificationPhoneDto, VerifyEmailDto, VerifyPhoneDto } from '../dtos/verification.dto';
import { Cron } from '@nestjs/schedule';
import { UserService } from 'src/modules/user/user/user.service';

@Injectable()
export class VerificationService {
    private readonly logger = new Logger(VerificationService.name);

    constructor(
        @InjectRepository(Verification)
        private verificationRepository: Repository<Verification>,
        private userService: UserService,
        private emailService: MailService,
        private smsService: SmsService,
    ) { }


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
    async sendVerificationEmail(
        sendVerificationEmailDto: SendVerificationEmailDto,
        forgotPassword: boolean = false,
    ): Promise<{ result: string }> {
        // find a user with email & validate
        const foundUser = await this.userService.userExistsBy("email", sendVerificationEmailDto.email);

        if (!forgotPassword && foundUser) {
            throw new ConflictException('This email is already in use');
        }

        if (forgotPassword && !foundUser) {
            throw new BadRequestException('User not found');
        }

        const foundVerification = await this.verificationRepository.findOne({
            where: { email: sendVerificationEmailDto.email },
        });

        // if verfication is found, increase count and send an email
        if (foundVerification) {
            if (foundVerification.email_code_count >= 5) {
                throw new BadRequestException(
                    'You have reached the maximum verification code sent limit, please try again tomorrow or contact the Farmera team',
                );
            }

            foundVerification.email_code = this.generateFourDigitCode();
            foundVerification.email_code_count += 1;
            foundVerification.updated_at = new Date();

            await this.verificationRepository.save(foundVerification);

            setTimeout(async () => {
                if (!forgotPassword) {
                    await this.sendEmailCode(
                        sendVerificationEmailDto.email,
                        foundVerification.email_code,
                    );
                } else {
                    await this.sendEmailResetCode(
                        sendVerificationEmailDto.email,
                        foundVerification.email_code,
                    );
                }
            }, 0);
        }
        // create new verification and send email
        else {
            const newVerification = this.verificationRepository.create({
                ...sendVerificationEmailDto,
                email_code: this.generateFourDigitCode(),
                email_code_count: 1,
                created_at: new Date(),
                updated_at: new Date(),
            });

            await this.verificationRepository.save(newVerification);

            setTimeout(async () => {
                if (!forgotPassword) {
                    await this.sendEmailCode(
                        sendVerificationEmailDto.email,
                        newVerification.email_code,
                    );
                } else {
                    await this.sendEmailResetCode(
                        sendVerificationEmailDto.email,
                        newVerification.email_code,
                    );
                }
            }, 0);
        }

        return {
            result: 'Success',
        };
    }

    async verifyEmail(verifyEmailDto: VerifyEmailDto) {
        const foundVerification = await this.verificationRepository.findOne({
            where: { email: verifyEmailDto.email },
        });

        if (!foundVerification) {
            throw new BadRequestException('Verification not found for this email');
        }

        if (foundVerification.email_code !== verifyEmailDto.verification_code) {
            throw new BadRequestException('Invalid verification code');
        }

        return {
            result: 'Success',
        };
    }

    async sendVerificationPhone(
        sendVerificationPhoneDto: SendVerificationPhoneDto,
        forgotPassword = false,
    ) {
        const phone = sendVerificationPhoneDto.phone;

        const foundUser = await this.userService.userExistsBy("phone", phone);

        if (!forgotPassword && foundUser) {
            throw new ConflictException('This phone number is already in use');
        }

        if (forgotPassword && !foundUser) {
            throw new BadRequestException('User not found');
        }

        const foundVerification = await this.verificationRepository.findOne({
            where: { phone },
        });

        if (foundVerification) {
            if (foundVerification.phone_code_count >= 5) {
                throw new BadRequestException(
                    'You have reached the maximum verification code sent limit, please try again tomorrow or contact the Farmera team',
                );
            }

            foundVerification.phone_code = this.generateFourDigitCode();
            foundVerification.phone_code_count += 1;
            foundVerification.updated_at = new Date();

            await this.verificationRepository.save(foundVerification);

            setTimeout(async () => {
                if (!forgotPassword) {
                    await this.sendPhoneCode(
                        phone,
                        foundVerification.phone_code,
                    );
                } else {
                    await this.sendPhoneResetCode(
                        phone,
                        foundVerification.phone_code,
                    );
                }
            }, 0);
        } else {
            const newVerification = this.verificationRepository.create({
                phone,
                phone_code: this.generateFourDigitCode(),
                phone_code_count: 1,
                created_at: new Date(),
                updated_at: new Date(),
            });

            await this.verificationRepository.save(newVerification);

            setTimeout(async () => {
                if (!forgotPassword) {
                    await this.sendPhoneCode(phone, newVerification.phone_code);
                } else {
                    await this.sendPhoneResetCode(
                        phone,
                        newVerification.phone_code,
                    );
                }
            }, 0);
        }

        return {
            result: 'Success',
        };
    }

    async verifyPhone(verifyPhoneDto: VerifyPhoneDto) {

        const foundVerification = await this.verificationRepository.findOne({
            where: { phone: verifyPhoneDto.phone },
        });

        if (!foundVerification) {
            throw new BadRequestException(
                'Verification not found for this phone number',
            );
        }

        if (foundVerification.phone_code !== verifyPhoneDto.verification_code) {
            throw new BadRequestException('Invalid verification code');
        }

        return {
            result: 'Success',
        };
    }

    /*#########################################################################
                               Private functions                             
    #########################################################################*/

    private async sendEmailCode(email: string, code: string) {
        const subject = 'Your Verification Code';
        const text = `Hi,

Please use the code below to verify your email:
${code}

Please let us know if you have any questions or need assistance at support@farmeravietnam.com.

Best regards,
Farmera Team`;

        const html = `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
    <h2 style="text-align: center; color: #034460;">Email Verification</h2>
    <p>Hi,</p>
    <p>Please use the code below to verify your email:</p>
    <div style="text-align: center; margin: 20px 0;">
      <span style="font-size: 24px; font-weight: bold; color: #333; background-color: #f9f9f9; padding: 10px 20px; border: 1px solid #ddd; border-radius: 5px;">${code}</span>
    </div>
    <p>Please let us know if you have any questions or need assistance at support@farmeravietnam.com.</p>
    <p style="text-align: right;">Best regards,<br>Farmera Team</p>
  </div>
</div>
`;

        await this.emailService.sendEmail(email, subject, text, html);
    }

    private async sendEmailResetCode(email: string, code: string) {
        const subject = 'Your Password Reset Code';
        const text = `Hi,

Please use the code below to reset your password:
${code}

Please let us know if you have any questions or need assistance at support@farmeravietnam.com.

Best regards,
Farmera Team`;

        const html = `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
    <h2 style="text-align: center; color: #034460;">Password Reset</h2>
    <p>Hi,</p>
    <p>Please use the code below to reset your password:</p>
    <div style="text-align: center; margin: 20px 0;">
      <span style="font-size: 24px; font-weight: bold; color: #333; background-color: #f9f9f9; padding: 10px 20px; border: 1px solid #ddd; border-radius: 5px;">${code}</span>
    </div>
    <p>Please let us know if you have any questions or need assistance at support@farmeravietnam.com.</p>
    <p style="text-align: right;">Best regards,<br>Farmera Team</p>
  </div>
</div>
`;

        await this.emailService.sendEmail(email, subject, text, html);
    }

    private async sendPhoneCode(phoneNumber: string, code: string) {
        try {
            await this.smsService.sendVerificationCode(phoneNumber, code);
        } catch (error) {
            throw new BadRequestException('Failed to send SMS verification code');
        }
    }

    private async sendPhoneResetCode(phoneNumber: string, code: string) {
        try {
            await this.smsService.sendPasswordResetCode(phoneNumber, code);
        } catch (error) {
            throw new BadRequestException('Failed to send SMS reset code');
        }
    }

    private generateFourDigitCode() {
        return Math.floor(1000 + Math.random() * 9000).toString();
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
}
