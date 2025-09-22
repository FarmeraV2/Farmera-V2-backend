import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dtos/user/create-user.dto';
import { PublicUserDto, publicUserFields, UserDto } from '../dtos/user/user.dto';
import { plainToInstance } from 'class-transformer';
import { HashService } from 'src/services/hash.service';
import { UpdateProfileDto } from '../dtos/user/update-profile.dto';

@Injectable()
export class UserService {

    private readonly logger = new Logger(UserService.name);

    constructor(
        @InjectRepository(User) private userRepository: Repository<User>,
        // @InjectRepository(Location)
        // private locationsRepository: Repository<Location>,
        // @InjectRepository(PaymentMethod)
        // private paymentMethodsRepository: Repository<PaymentMethod>,
        private readonly hashService: HashService
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
    async createUser(createUserDto: CreateUserDto): Promise<UserDto> {
        try {
            const existingEmail = await this.userRepository.existsBy({
                email: createUserDto.email
            });
            if (existingEmail) {
                throw new ConflictException('This email is already in use');
            }

            const existingPhone = await this.userRepository.existsBy({
                email: createUserDto.email
            });
            if (existingPhone) {
                throw new ConflictException('This phone number is already in use');
            }

            // hash password
            const { password } = createUserDto;
            const hashed = await this.hashService.hashPassword(password);

            const newUser = this.userRepository.create({ ...createUserDto, hashed_pwd: hashed });
            const savedUser = await this.userRepository.save(newUser);

            // exclude unnecessary infomations e.g. password
            return plainToInstance(UserDto, savedUser, { excludeExtraneousValues: true });
        }
        catch (error) {
            if (error instanceof ConflictException) throw error;
            this.logger.error(error.message);
            throw new InternalServerErrorException("Failed to create user");
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
    async userExistsBy(option: "email" | "phone" | "id", value: string): Promise<boolean> {
        if (option === "email") {
            return await this.userRepository.existsBy({ email: value });
        }
        else if (option === "phone") {
            return await this.userRepository.existsBy({ phone: value });
        }
        else {
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
                throw new BadRequestException('Email or phone is required');
            }

            const where: any[] = [];
            if (email) where.push({ email });
            if (phone) where.push({ phone });

            const user = await this.userRepository.findOne({ where });

            // validate password
            if (
                user &&
                user.hashed_pwd &&
                (await this.hashService.comparePassword(password, user.hashed_pwd))
            ) {
                // exclude unnecessary infomations
                return plainToInstance(UserDto, user, { excludeExtraneousValues: true });
            }
            throw new BadRequestException('Invalid email or password');
        }
        catch (error) {
            if (error instanceof BadRequestException) throw error;
            this.logger.error(error.message);
            throw new InternalServerErrorException("Failed to validate user");
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
        if (!email && !password) throw new BadRequestException("Email or phone is required");

        try {
            // hashing
            const hashed_pwd = await this.hashService.hashPassword(password);
            let result: number | undefined;

            // update
            if (email) {
                result = (await this.userRepository.update(email, { hashed_pwd })).affected;
            }
            else if (phone) {
                result = (await this.userRepository.update(phone, { hashed_pwd })).affected;
            }

            // validate result
            if (!result || result <= 0) {
                throw new InternalServerErrorException();
            }
        }
        catch (error) {
            this.logger.error(error.message);
            throw new InternalServerErrorException("Failed to update password");
        }
    }

    /**
     * @function getUserById - Retrieves a user by ID with optional related data
     * @param {number} id - The unique identifier of the user
     * @param {boolean} [location] - Whether to include the user's location relation
     * @param {boolean} [paymentMethod] - Whether to include the user's payment method relation
     *
     * @returns {Promise<UserDto>} - The user data matching the provided ID
     *
     * @throws {NotFoundException} - If no user is found with the given ID
     * @throws {InternalServerErrorException} - If an unexpected error occurs while fetching the user
     */
    async getUserById(id: number, location?: boolean, paymentMethod?: boolean): Promise<UserDto> {
        try {
            const relations: string[] = [];
            if (location) relations.push("locations");
            if (paymentMethod) relations.push("payment_methods");

            const user = await this.userRepository.findOne({
                where: { id },
                relations: relations,
            });

            if (!user) {
                throw new NotFoundException(`User not found`);
            }
            return plainToInstance(UserDto, user, { excludeExtraneousValues: true });
        }
        catch (error) {
            if (error instanceof NotFoundException) throw error;
            this.logger.error(error.message);
            throw new InternalServerErrorException("Failed to find user by ID");
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
        }
        catch (error) {
            this.logger.error(error.message);
            throw new InternalServerErrorException("Failed to update user profile");
        }
    }

    /**
     * @function getPublicUser - Retrieves a user's public profile data by UUID
     * @param {string} uuid - The unique identifier of the user
     *
     * @returns {Promise<PublicUserDto>} - Returns the user's public information, excluding sensitive fields
     *
     * @throws {NotFoundException} - If no user is found with the given UUID
     * @throws {InternalServerErrorException} - If there is an unexpected error during retrieval
     */
    async getPublicUser(uuid: string): Promise<PublicUserDto> {
        try {
            const user = await this.userRepository.findOne({
                select: publicUserFields,
                where: { uuid }
            });

            if (!user) {
                throw new NotFoundException(`User with ID ${uuid} not found`);
            }
            return plainToInstance(PublicUserDto, user, { excludeExtraneousValues: true });
        }
        catch (error) {
            if (error instanceof NotFoundException) throw error;
            this.logger.error(error.message);
            throw new InternalServerErrorException("Failed to find user by uuid");
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

    // async listUsers(
    //     filters: {
    //         page?: number;
    //         limit?: number;
    //         role_filter?: UserRole;
    //         status_filter?: UserStatus;
    //         search_query?: string;
    //         sort_by?: string;
    //         sort_order?: "ASC" | "DESC"
    //         created_date_range?: { start_time?: Date; end_time?: Date };
    //     } = {},
    // ) {
    //     const validOrder = ["id", "email", "first_name", "last_name", "gender", "role", "status", "updated_at", "created_at", "points"]
    //     const {
    //         page = 1,
    //         limit = 10,
    //         role_filter,
    //         status_filter,
    //         search_query,
    //         created_date_range,
    //         sort_by,
    //         sort_order = "ASC"
    //     } = filters;
    //     if (sort_by && !validOrder.includes(sort_by)) throw new BadRequestException(`Invalid properties ${sort_by}`)

    //     const queryBuilder = this.usersRepository.createQueryBuilder('user');

    //     if (role_filter) {
    //         queryBuilder.andWhere('user.role = :role', { role: role_filter });
    //     }

    //     if (status_filter) {
    //         queryBuilder.andWhere('user.status = :status', { status: status_filter });
    //     }

    //     if (search_query) {
    //         queryBuilder.andWhere(
    //             '(user.first_name ILIKE :search OR user.last_name ILIKE :search OR user.email ILIKE :search)',
    //             { search: `%${search_query}%` },
    //         );
    //     }

    //     if (created_date_range?.start_time && created_date_range?.end_time) {
    //         queryBuilder.andWhere('user.created_at BETWEEN :start AND :end', {
    //             start: created_date_range.start_time,
    //             end: created_date_range.end_time,
    //         });
    //     }

    //     const offset = (page - 1) * limit;
    //     queryBuilder.skip(offset).take(limit);
    //     if (sort_by) {
    //         switch (sort_by) {
    //             case "id":
    //                 queryBuilder.orderBy('user.id', sort_order);
    //                 break;
    //             case "email":
    //                 queryBuilder.orderBy('user.email', sort_order);
    //                 break;
    //             case "first_name":
    //                 queryBuilder.orderBy('user.first_name', sort_order);
    //                 break;
    //             case "last_name":
    //                 queryBuilder.orderBy('user.last_name', sort_order);
    //                 break;
    //             case "gender":
    //                 queryBuilder.orderBy('user.gender', sort_order);
    //                 break;
    //             case "role":
    //                 queryBuilder.orderBy('user.role', sort_order);
    //                 break;
    //             case "status":
    //                 queryBuilder.orderBy('user.status', sort_order);
    //                 break;
    //             case "updated_at":
    //                 queryBuilder.orderBy('user.updated_at', sort_order);
    //                 break;
    //             case "created_at":
    //                 queryBuilder.orderBy('user.created_at', sort_order);
    //                 break;
    //             case "points":
    //                 queryBuilder.orderBy('user.points', sort_order);
    //                 break;
    //             default:
    //                 throw new BadRequestException(`Invalid sort_by value: ${sort_by}`);
    //         }
    //     } else {
    //         queryBuilder.orderBy('user.created_at', 'DESC');
    //     }

    //     const [users, total] = await queryBuilder.getManyAndCount();

    //     return {
    //         users,
    //         pagination: {
    //             total_items: total,
    //             total_pages: Math.ceil(total / limit),
    //             current_page: page,
    //             page_size: limit,
    //             has_next_page: page * limit < total,
    //             has_previous_page: page > 1,
    //         },
    //     };
    // }

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
