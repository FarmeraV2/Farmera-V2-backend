import {
    BadRequestException,
    ConflictException,
    HttpException,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dtos/user/create-user.dto';
import { PublicUserDto, UserDto } from '../dtos/user/user.dto';
import { plainToInstance } from 'class-transformer';
import { HashService } from 'src/services/hash.service';
import { UpdateProfileDto } from '../dtos/user/update-profile.dto';
import { ResponseCode } from 'src/common/constants/response-code.const';
import { UserRole } from 'src/common/enums/role.enum';
import { DeliveryAddressService } from 'src/modules/address/delivery-address/delivery-address.service';
import { ListUserDto } from '../dtos/user/list-user.dto';
import { PaginationTransform } from 'src/common/dtos/pagination/pagination-option.dto';
import { UserSortFields } from '../enums/user-sort-fields.enum';
import { applyPagination } from 'src/common/utils/pagination.util';
import { PaginationMeta } from 'src/common/dtos/pagination/pagination-meta.dto';
import { PaginationResult } from 'src/common/dtos/pagination/pagination-result.dto';
import { UpdateUserStatus } from '../dtos/user/update-user-status.dto';
import { b } from 'pinata/dist/gateway-tools-Cd7xutmh';

@Injectable()
export class UserService {
    private readonly logger = new Logger(UserService.name);

    constructor(
        @InjectRepository(User) private userRepository: Repository<User>,
        // @InjectRepository(Location)
        // private locationsRepository: Repository<Location>,
        // @InjectRepository(PaymentMethod)
        // private paymentMethodsRepository: Repository<PaymentMethod>,
        private readonly hashService: HashService,
        private readonly deliveryAddressService: DeliveryAddressService,
    ) { }

    /**
     * @function createUser - Creates a new user
     * @param {CreateUserDto} createUserDto - Data required to create a user
     *
     * @returns {Promise<UserDto>} - The created user information, excluding sensitive fields like the password.
     *
     * @throws {ConflictException} - Thrown if:
     *  - The email is already in use.
     *  - The phone number is already in use.
     * @throws {InternalServerErrorException} - Thrown if an unexpected error occurs during creation.
     */
    async createUser(createUserDto: CreateUserDto, isAdmin?: boolean): Promise<UserDto> {
        try {
            const existingEmail = await this.userRepository.existsBy({
                email: createUserDto.email,
            });
            if (existingEmail) {
                throw new ConflictException({
                    message: 'This email is already in use',
                    code: ResponseCode.EMAIL_CONFLICT
                });
            }

            const existingPhone = await this.userRepository.existsBy({
                phone: createUserDto.phone,
            });
            if (existingPhone) {
                throw new ConflictException({
                    message: 'This phone number is already in use',
                    code: ResponseCode.PHONE_CONFLICT
                });
            }

            // hash password
            const { password } = createUserDto;
            const hashed = await this.hashService.hashPassword(password);

            const newUser = this.userRepository.create({ ...createUserDto, hashed_pwd: hashed });
            if (isAdmin) newUser.role = UserRole.ADMIN;
            const savedUser = await this.userRepository.save(newUser);

            // exclude unnecessary infomations e.g. password
            return plainToInstance(UserDto, savedUser, { excludeExtraneousValues: true });
        } catch (error) {
            this.logger.error(error.message);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException({
                message: "Failed to create user",
                code: ResponseCode.FAILED_TO_CREATE_USER
            });
        }
    }

    /**
     * @function userExistsBy - Checks whether a user exists in the database by email or phone.
     * @param {"email" | "phone"} option - The field to check against:
     *  - `"email"`: Check if the email exists.
     *  - `"phone"`: Check if the phone number exists.
     * @param {string} value - The value of the email or phone number to look up.
     *
     * @returns {Promise<boolean>} - Resolves to:
     *  - `true` if a user with the specified email or phone exists.
     *  - `false` if no user matches the provided value.
     */
    async userExistsBy(option: 'email' | 'phone' | 'id', value: string): Promise<boolean> {
        if (option === 'email') {
            return await this.userRepository.existsBy({ email: value });
        } else if (option === 'phone') {
            return await this.userRepository.existsBy({ phone: value });
        } else {
            return await this.userRepository.existsBy({ id: parseInt(value) });
        }
    }

    /**
     * @function validateUser - Validates a user's credentials by email or phone and password
     * @param {string} password - The plain-text password
     * @param {string} [email] - Optional email
     * @param {string} [phone] - Optional phone number
     *
     * @returns {Promise<User>} - Resolves with the matching user entity if validation succeeds
     *
     * @throws {BadRequestException} - Thrown if:
     *  - Neither `email` nor `phone` is provided.
     *  - The credentials are invalid (no matching user or incorrect password).
     */
    async validateUser(password: string, email?: string, phone?: string): Promise<UserDto> {
        try {
            if (!phone && !email) {
                throw new BadRequestException({
                    message: 'Email or phone is required',
                    code: ResponseCode.EMAIL_OR_PHONE_IS_REQUIRED
                });
            }

            const where: any[] = [];
            if (email) where.push({ email });
            if (phone) where.push({ phone });

            const user = await this.userRepository.findOne({ where });

            // validate password
            if (user && user.hashed_pwd && (await this.hashService.comparePassword(password, user.hashed_pwd))) {
                // exclude unnecessary infomations
                return plainToInstance(UserDto, user, { excludeExtraneousValues: true });
            }
            throw new BadRequestException({
                message: 'Invalid email or password',
                code: ResponseCode.INVALID_EMAIL_OR_PASSWORD
            });
        } catch (error) {
            if (error instanceof HttpException) throw error;
            this.logger.error(error.message);
            throw new InternalServerErrorException({
                message: 'Failed to validate user',
                code: ResponseCode.FAILED_TO_VALIDATE_USER
            });
        }
    }

    /**
     * @function updateUserPassword - Updates a user's password based on email or phone
     * @param {string} password - The new password to set
     * @param {string} [email] - The email of the user (optional if phone is provided)
     * @param {string} [phone] - The phone number of the user (optional if email is provided)
     *
     * @returns {Promise<void>} - Resolves when the password is successfully updated
     *
     * @throws {BadRequestException} - If neither email nor phone is provided
     * @throws {InternalServerErrorException} - If the update fails or no rows are affected
     */
    async updateUserPassword(password: string, email?: string, phone?: string): Promise<void> {
        if (!email && !password) throw new BadRequestException({
            message: 'Email or phone is required',
            code: ResponseCode.EMAIL_OR_PHONE_IS_REQUIRED
        });

        try {
            // hashing
            const hashed_pwd = await this.hashService.hashPassword(password);
            let result: number | undefined;

            // update
            if (email) {
                result = (await this.userRepository.update({ email: email }, { hashed_pwd })).affected;
            } else if (phone) {
                result = (await this.userRepository.update({ phone: phone }, { hashed_pwd })).affected;
            }

            // validate result
            if (!result || result <= 0) {
                throw new InternalServerErrorException();
            }
        } catch (error) {
            this.logger.error(`Failed to update password: ${error.message}`);
            throw new InternalServerErrorException({
                message: 'Failed to update password',
                ResponseCode: ResponseCode.FAILED_TO_UPDATE_PASSWORD
            });
        }
    }

    /**
     * @function getUserById - Retrieves a user by ID with optional related data
     * @param {number} id - The unique identifier of the user
     * @param {boolean} [addresses] - Whether to include the user's addresses relation
     * @param {boolean} [paymentMethod] - Whether to include the user's payment method relation
     *
     * @returns {Promise<UserDto>} - The user data matching the provided ID
     *
     * @throws {NotFoundException} - If no user is found with the given ID
     * @throws {InternalServerErrorException} - If an unexpected error occurs while fetching the user
     */
    async getUserById(id: number, addresses?: boolean, paymentMethod?: boolean): Promise<UserDto> {
        try {
            const relations: string[] = [];
            if (paymentMethod) relations.push('payment_methods');

            const user = await this.userRepository.findOne({
                where: { id },
                relations: relations,
            });

            if (!user) {
                throw new NotFoundException({
                    message: `User not found`,
                    code: ResponseCode.USER_NOT_FOUND
                });
            }

            const userDto = plainToInstance(UserDto, user, { excludeExtraneousValues: true });

            if (addresses) {
                const addresses = await this.deliveryAddressService.getUserAddresses(id);
                userDto.addresses = addresses;
            }

            return userDto;

        } catch (error) {
            if (error instanceof HttpException) throw error;
            this.logger.error(error.message);
            throw new InternalServerErrorException({
                message: 'Failed to find user by ID',
                code: ResponseCode.FAILED_TO_FIND_USER,
            });
        }
    }

    /**
     * @function updateUserProfile - Updates a user's profile with new data
     * @param {number} id - The unique identifier of the user
     * @param {UpdateProfileDto} newUserProfile - DTO containing the updated user profile fields
     *
     * @returns {Promise<UserDto>} - Returns the updated user data
     *
     * @throws {InternalServerErrorException} - If the profile update fails
     */
    async updateUserProfile(id: number, newUserProfile: UpdateProfileDto): Promise<UserDto> {
        try {
            const data = this.userRepository.create(newUserProfile);
            await this.userRepository.update({ id }, data);
            return await this.getUserById(id);
        } catch (error) {
            this.logger.error(error.message);
            throw new InternalServerErrorException({
                message: 'Failed to update user profile',
                code: ResponseCode.FAILED_TO_UPDATE_USER
            });
        }
    }

    /**
     * @function getPublicUser - Retrieves a user's public profile data by user id
     * @param {number} id - The unique identifier of the user
     *
     * @returns {Promise<PublicUserDto>} - Returns the user's public information, excluding sensitive fields
     *
     * @throws {NotFoundException} - If no user is found with the given UUID
     * @throws {InternalServerErrorException} - If there is an unexpected error during retrieval
     */
    async getPublicUser(id: number): Promise<PublicUserDto> {
        try {
            const user = await this.userRepository.findOne({ where: { id } });
            if (!user) {
                throw new NotFoundException({
                    message: `User with ID ${id} is not found`,
                    code: ResponseCode.USER_NOT_FOUND
                });
            }
            return plainToInstance(PublicUserDto, user, { excludeExtraneousValues: true });
        } catch (error) {
            if (error instanceof HttpException) throw error;
            this.logger.error(error.message);
            throw new InternalServerErrorException({
                message: 'Failed to find user by uuid',
                code: ResponseCode.FAILED_TO_FIND_USER
            });
        }
    }

    async updateRole(id: number, role: UserRole, manager?: EntityManager): Promise<boolean> {
        try {
            const repo = manager ? manager.getRepository(User) : this.userRepository;
            const result = await repo.update({ id: id }, { role: role })
            if (!result || !result.affected || result.affected <= 0) {
                throw new InternalServerErrorException();
            }
            return true;
        } catch (error) {
            this.logger.error("Failed to update user role");
            throw new InternalServerErrorException({
                message: "Failed to update user role",
                code: ResponseCode.FAILED_TO_UPDATE_ROLE,
            })
        }
    }
    // async getUserDetails(id: number, )

    // async deleteUser(id: string, hardDelete = false) {
    //     const user = await this.getUserById(id);

    //     if (hardDelete) {
    //         await this.usersRepository.delete(id);
    //         return { success: true, message: 'User permanently deleted' };
    //     } else {
    //         await this.usersRepository.update(id, {
    //             status: UserStatus.INACTIVE,
    //             updated_at: new Date(),
    //         });
    //         return { success: true, message: 'User deactivated successfully' };
    //     }
    // }

    async listUsers(listUserDto: ListUserDto): Promise<PaginationResult<PublicUserDto>> {
        const paginationOptions = plainToInstance(PaginationTransform<UserSortFields>, listUserDto);
        const { sort_by, order, search } = listUserDto;
        try {
            const queryBuilder = this.userRepository.createQueryBuilder('user');

            if (search?.trim()) {
                queryBuilder.andWhere(
                    '(user.first_name ILIKE :search OR user.last_name ILIKE :search OR user.email ILIKE :search)',
                    { search: `%${search}%` },
                );
            }

            if (sort_by || order) {
                switch (sort_by) {
                    case UserSortFields.ID:
                        queryBuilder.orderBy('user.id', order);
                        break;
                    case UserSortFields.EMAIL:
                        queryBuilder.orderBy('user.email', order);
                        break;
                    case UserSortFields.NAME:
                        queryBuilder.orderBy('user.first_name', order).addOrderBy('user.last_name', order);
                        break;
                    case UserSortFields.UPDATED_AT:
                        queryBuilder.orderBy('user.updated_at', order);
                        break;
                    default:
                        queryBuilder.orderBy('user.id', order);
                        break;
                }
            }

            const totalItems = await applyPagination(queryBuilder, paginationOptions);
            const users = await queryBuilder.getMany();
            const meta = new PaginationMeta({ paginationOptions, totalItems });

            return new PaginationResult(plainToInstance(
                PublicUserDto,
                users,
                { excludeExtraneousValues: true }
            ), meta);
        }
        catch (error) {
            this.logger.error("Failed to list users");
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException({
                message: "Failed to list users",
                code: ResponseCode.INTERNAL_ERROR,
            })
        }
    }

    async updateUserStatus(updateUserStatusDto: UpdateUserStatus): Promise<boolean> {
        const result = await this.userRepository.update({ id: updateUserStatusDto.user_id }, { status: updateUserStatusDto.status });
        if (!result || !result.affected || result.affected <= 0) {
            return false;
        }
        return true;
    }

    // async getUsersByRole(
    //     role: UserRole,
    //     pagination?: { page?: number; limit?: number },
    // ) {
    //     const { page = 1, limit = 10 } = pagination || {};

    //     return this.listUsers({
    //         page,
    //         limit,
    //         role_filter: role,
    //     });
    // }

    // async updateUserStatus(
    //     id: string,
    //     status: UserStatus,
    //     reason?: string,
    //     adminId?: string,
    // ) {
    //     const user = await this.getUserById(id);

    //     await this.usersRepository.update(id, {
    //         status,
    //         updated_at: new Date(),
    //     });

    //     return this.getUserById(id);
    // }

    // async updateUserRole(
    //     id: string,
    //     role: UserRole,
    //     farmId?: string,
    // ): Promise<User> {
    //     const user = await this.getUserById(id);
    //     if (!user) throw new NotFoundException("User not found");

    //     if (role === UserRole.FARMER && !farmId)
    //         throw new BadRequestException("Cannot update to farmer role because farm ID is not specified")

    //     const updateData: any = {
    //         role,
    //         updated_at: new Date(),
    //     };

    //     // If farmId is provided, update it as well
    //     if (farmId) {
    //         updateData.farm_id = farmId;
    //     }

    //     await this.usersRepository.update(id, updateData);

    //     return this.getUserById(id);
    // }

    // async getUserByEmail(email: string) {
    //     const user = await this.usersRepository.findOne({
    //         where: { email },
    //         relations: ['locations', 'payment_methods'],
    //     });

    //     if (!user) {
    //         throw new NotFoundException(`User with this email not found`);
    //     }

    //     return user;
    // }

    // // Location Management

    // // Payment Method Management
    // async addPaymentMethod(
    //     userId: string,
    //     createPaymentDto: CreatePaymentDto,
    // ): Promise<PaymentMethod> {
    //     const user = await this.getUserById(userId);

    //     if (createPaymentDto.is_default) {
    //         await this.paymentMethodsRepository.update(
    //             { user: { id: userId } },
    //             { is_default: false },
    //         );
    //     }

    //     const newPaymentMethod =
    //         this.paymentMethodsRepository.create(createPaymentDto);
    //     newPaymentMethod.user = user;

    //     return await this.paymentMethodsRepository.save(newPaymentMethod);
    // }

    // async getUserPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    //     return this.paymentMethodsRepository.find({
    //         where: { user: { id: userId }, is_active: true },
    //         order: { is_default: 'DESC', created_at: 'DESC' },
    //     });
    // }

    // async updatePaymentMethod(
    //     userId: string,
    //     paymentMethodId: number,
    //     paymentData: UpdatePaymentMethodDto,
    // ): Promise<PaymentMethod> {
    //     const paymentMethod = await this.paymentMethodsRepository.findOne({
    //         where: { payment_method_id: paymentMethodId, user: { id: userId } },
    //     });

    //     if (!paymentMethod) {
    //         throw new NotFoundException(
    //             `Payment method with ID ${paymentMethodId} not found`,
    //         );
    //     }

    //     // If setting this as default, unset other default payment methods for this user
    //     if (paymentData.is_default) {
    //         await this.paymentMethodsRepository.update(
    //             { user: { id: userId } },
    //             { is_default: false },
    //         );
    //     }

    //     await this.paymentMethodsRepository.update(paymentMethodId, {
    //         ...paymentData,
    //         updated_at: new Date(),
    //     });

    //     return await this.paymentMethodsRepository.findOne({
    //         where: { payment_method_id: paymentMethodId },
    //     });
    // }

    // async deletePaymentMethod(paymentMethodId: number) {
    //     const paymentMethod = await this.paymentMethodsRepository.findOne({
    //         where: { payment_method_id: paymentMethodId },
    //     });

    //     if (!paymentMethod) {
    //         throw new NotFoundException(
    //             `Payment method with ID ${paymentMethodId} not found`,
    //         );
    //     }

    //     await this.paymentMethodsRepository.update(paymentMethodId, {
    //         is_active: false,
    //         updated_at: new Date(),
    //     });

    //     return { success: true, message: 'Payment method deleted successfully' };
    // }

    // // Statistics and Analytics
    // async getUserStats(filters?: {
    //     date_range?: { start_time?: Date; end_time?: Date };
    //     role_filter?: UserRole;
    // }) {
    //     const queryBuilder = this.usersRepository.createQueryBuilder('user');

    //     if (filters?.date_range?.start_time && filters?.date_range?.end_time) {
    //         queryBuilder.andWhere('user.created_at BETWEEN :start AND :end', {
    //             start: filters.date_range.start_time,
    //             end: filters.date_range.end_time,
    //         });
    //     }

    //     const totalUsers = await queryBuilder.getCount();

    //     const activeUsers = await this.usersRepository.count({
    //         where: { status: UserStatus.ACTIVE },
    //     });

    //     const startOfMonth = new Date();
    //     startOfMonth.setDate(1);
    //     startOfMonth.setHours(0, 0, 0, 0);

    //     const newUsersThisMonth = await this.usersRepository.count({
    //         where: {
    //             created_at: Between(startOfMonth, new Date()),
    //         },
    //     });

    //     const usersByRole = {};
    //     for (const role of Object.values(UserRole)) {
    //         usersByRole[role] = await this.usersRepository.count({ where: { role } });
    //     }

    //     const usersByStatus = {};
    //     for (const status of Object.values(UserStatus)) {
    //         usersByStatus[status] = await this.usersRepository.count({
    //             where: { status },
    //         });
    //     }

    //     const verifiedUsers = await this.usersRepository.count({
    //         where: { status: UserStatus.ACTIVE },
    //     });

    //     return {
    //         total_users: totalUsers,
    //         active_users: activeUsers,
    //         new_users_this_month: newUsersThisMonth,
    //         users_by_role: usersByRole,
    //         users_by_status: usersByStatus,
    //         average_session_duration: 0,
    //         verified_users: verifiedUsers,
    //         unverified_users: totalUsers - verifiedUsers,
    //     };
    // }

    // async getUserProfile(userId: string) {
    //     const user = await this.usersRepository.findOne({
    //         where: { id: userId },
    //         relations: ['locations', 'payment_methods'],
    //     });

    //     if (!user) {
    //         throw new NotFoundException(`User with ID ${userId} not found`);
    //     }

    //     const userStats = {
    //         total_orders: 0, // TODO: Implement with orders service
    //         total_reviews: 0, // TODO: Implement with reviews service
    //         loyalty_points: user.points || 0,
    //         member_since: user.created_at,
    //     };

    //     return {
    //         user,
    //         stats: userStats,
    //     };
    // }

    // // Helper methods
    // private formatExpiryDate(date: Date): string {
    //     const month = (date.getMonth() + 1).toString().padStart(2, '0');
    //     const year = date.getFullYear().toString().slice(-2);
    //     return `${month}/${year}`;
    // }

    // async getUserLite(id: string): Promise<UserLite> {
    //     const user = await this.usersRepository.findOne({ where: { id: id } });
    //     if (user) {
    //         return {
    //             id: user.id,
    //             email: user.email,
    //             first_name: user.first_name,
    //             last_name: user.last_name,
    //             farm_id: user.farm_id,
    //             avatar: user.avatar,
    //         }
    //     }
    //     throw new NotFoundException("User not found");
    // }

    /*#########################################################################
                                   Deprecated                                
    #########################################################################*/
    // async updateUser(id: string, updateData: Partial<CreateUserDto>): Promise<User> {
    //     const user = await this.getUserById(id);

    //     const updateFields: any = { updated_at: new Date() };

    //     if (updateData.first_name) updateFields.first_name = updateData.first_name;
    //     if (updateData.last_name) updateFields.last_name = updateData.last_name;
    //     if (updateData.gender) updateFields.gender = updateData.gender;
    //     if (updateData.avatar) updateFields.avatar = updateData.avatar;
    //     if (updateData.birthday) updateFields.birthday = updateData.birthday;

    //     await this.userRepository.update(id, updateFields);

    //     return this.getUserById(id);
    // }
}
