import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeliveryAddress } from '../entities/delivery-address.entity';
import { CreateAddressDto, CreateFarmAddressDto } from '../dtos/create-address.dto';
import { UpdateAddressDto } from '../dtos/update-address.dto';
import { AddressType } from '../enums/address-type.enums';
import { ResponseCode } from 'src/common/constants/response-code.const';
import { DeliveryAddressDto, deliveryAddressSelectFields } from '../dtos/delivery-address.dto';
import { newProvinceSelectFields, newWardSelectFields } from '../dtos/new-address.dto';
import { oldDistrictSelectFields, oldProvinceSelectFields, oldWardSelectFields } from '../dtos/old-address.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class DeliveryAddressService {
    private readonly logger = new Logger(DeliveryAddressService.name);

    constructor(@InjectRepository(DeliveryAddress) private readonly deliveryAddressRepository: Repository<DeliveryAddress>) { }

    /**
     * @function getUserAddresses - Retrieves all addresses of a specific user
     * @param {number} id - ID of the user
     *
     * @returns {Promise<DeliveryAddressDto[]>} - List of addresses associated with the user,
     * ordered with primary locations first and then by most recently created.
     *
     * @throws {InternalServerErrorException} - Thrown if an unexpected error occurs
     * during the retrieval process.
     */
    async getUserAddresses(id: number): Promise<DeliveryAddressDto[]> {
        // todo!("add index")
        try {
            const queryBuilder = this.deliveryAddressRepository.createQueryBuilder('delivery_address')
                .select(deliveryAddressSelectFields)
                .where("delivery_address.user_id = :userId", { userId: id })
                .orderBy("delivery_address.is_primary", "DESC")
                .addOrderBy("delivery_address.updated_at", "DESC")
                .leftJoin("delivery_address.province", "province").addSelect(newProvinceSelectFields)
                .leftJoin("delivery_address.ward", "ward").addSelect(newWardSelectFields)
                .leftJoin("delivery_address.old_province", "old_province").addSelect(oldProvinceSelectFields)
                .leftJoin("delivery_address.old_district", "old_district").addSelect(oldDistrictSelectFields)
                .leftJoin("delivery_address.old_ward", "old_ward").addSelect(oldWardSelectFields);

            const deleveryAddresses = await queryBuilder.getMany();

            return deleveryAddresses.map((address) =>
                plainToInstance(DeliveryAddressDto, address, { excludeExtraneousValues: true })
            );
        } catch (error) {
            this.logger.error(error.message);
            throw new InternalServerErrorException({
                message: 'Failed to get user addresses',
                code: ResponseCode.FAILED_TO_GET_USER_ADDRESS
            });
        }
    }

    /**
     * @function addUserAddress - Adds a new location for a specific user
     * @param {number} id - UUID of the user to whom the location will be added
     * @param {CreateAddressDto} locationData - Data required to create the new location
     *
     * @returns {Promise<DeliveryAddressDto>} - The newly created and saved address entity
     *
     * @throws {NotFoundException} - Thrown if the user does not exist when attempting to update existing locations
     * @throws {InternalServerErrorException} - Thrown if saving the new location fails unexpectedly.
     */
    async addUserAddress(id: number, locationData: CreateAddressDto): Promise<DeliveryAddressDto> {
        try {
            if (locationData.is_primary) {
                await this.deliveryAddressRepository.update({ user: { id } }, { is_primary: false });
            } else {
                // check if first address
                const exist = await this.deliveryAddressRepository.exists({ where: { user: { id }, is_primary: true } });
                if (!exist) {
                    locationData.is_primary = true;
                }
            }

            const newLocation = this.deliveryAddressRepository.create({
                ...locationData,
                user: { id },
            });

            const result = await this.deliveryAddressRepository.insert(newLocation);

            return await this.getAddressById(result.identifiers[0].address_id);
        } catch (error) {
            this.logger.error(error.message);
            throw new InternalServerErrorException({
                message: 'Failed to add new user address',
                code: ResponseCode.FAILED_TO_CREATE_USER_ADDRESS
            });
        }
    }

    /**
     * @function addFarmAddress - Creates a address for a given farm
     * @param {CreateFarmAddressDto} addressData - DTO containing the new address details
     *
     * @returns {Promise<DeliveryAddress>} - Returns the newly created and saved delivery address entity
     *
     * @throws {InternalServerErrorException} - If the address creation or saving process fails
     *
     * @WARNING This function should **NOT** be called directly from controllers or exposed to end users.
     * Always wrap this method inside a service-level function that enforces ownership and validation checks.
     */
    async addFarmAddress(addressData: CreateFarmAddressDto): Promise<DeliveryAddress> {
        try {
            const newAddress = this.deliveryAddressRepository.create({
                ...addressData,
                location: { lat: addressData.latitude, lng: addressData.longitude },
                owner_type: AddressType.FARM,
            });
            const savedLocation = await this.deliveryAddressRepository.save(newAddress);
            return savedLocation;
        } catch (error) {
            this.logger.error(error.message);
            throw new InternalServerErrorException({
                message: 'Failed to add new farm address',
                code: ResponseCode.FAILED_TO_CREATE_FARM_ADDRESS
            });
        }
    }

    /**
     * @function updateUserAddress - Updates an existing location for a specific user
     * @param {number} userId - ID of the user whose location is being updated
     * @param {number} addressId - ID of the address to be updated
     * @param {UpdateAddressDto} locationData - Data to update the location with
     *
     * @returns {Promise<DeliveryAddressDto>} - The updated location entity
     *
     * @throws {InternalServerErrorException} - Thrown if an unexpected error occurs
     * during the update process.
     */
    async updateUserAddress(userId: number, addressId: number, locationData: UpdateAddressDto): Promise<DeliveryAddressDto> {
        try {
            // If setting this as primary, unset other primary locations for this user
            if (locationData.is_primary) {
                await this.deliveryAddressRepository.update({ user: { id: userId } }, { is_primary: false });
            } else {
                const exist = await this.deliveryAddressRepository.exists({ where: { user: { id: userId }, is_primary: true } });
                if (!exist) {
                    locationData.is_primary = true;
                }
            }

            await this.deliveryAddressRepository.update({ address_id: addressId, user: { id: userId } }, locationData);

            return await this.getAddressById(addressId);
        } catch (error) {
            this.logger.error(error.message);
            throw new InternalServerErrorException({
                message: 'Failed to update user address',
                code: ResponseCode.FAILED_TO_UPDATE_USER_ADDRESS,
            });
        }
    }

    async deleteUserLocation(userId: number, addressId: number) {
        const location = await this.deliveryAddressRepository.findOne({
            where: { address_id: addressId, user: { id: userId } },
        });

        if (!location) {
            throw new NotFoundException({
                message: `Address with ID ${addressId} not found`,
                code: ResponseCode.ADDRESS_NOT_FOUND,
            });
        }

        await this.deliveryAddressRepository.delete({ address_id: addressId });

        // if a primary address is deleted, update another address to primary
        if (location.is_primary) {
            const toPrimary = await this.deliveryAddressRepository.findOne({
                select: ["address_id"],
                where: { user: { id: userId } },
            })
            if (toPrimary) {
                await this.deliveryAddressRepository.update({ address_id: toPrimary.address_id }, { is_primary: true });
            }
        }

        return { success: true, message: 'Location deleted successfully' };
    }


    /**
     * @function getAddressById - Retrieves an address by its id
     * @param {number} id - ID of the address
     *
     * @returns {Promise<DeliveryAddressDto>} - An address after remove unnecessary fields,
     * 
     * @throws {BadRequestException} - Thrown if an address is not found
     * @throws {InternalServerErrorException} - Thrown if an unexpected error occurs
     * during the retrieval process.
     */
    async getAddressById(id: number): Promise<DeliveryAddressDto> {
        try {
            const queryBuilder = this.deliveryAddressRepository.createQueryBuilder('delivery_address')
                .select(deliveryAddressSelectFields)
                .where("delivery_address.address_id = :id", { id })
                .leftJoin("delivery_address.province", "province").addSelect(newProvinceSelectFields)
                .leftJoin("delivery_address.ward", "ward").addSelect(newWardSelectFields)
                .leftJoin("delivery_address.old_province", "old_province").addSelect(oldProvinceSelectFields)
                .leftJoin("delivery_address.old_district", "old_district").addSelect(oldDistrictSelectFields)
                .leftJoin("delivery_address.old_ward", "old_ward").addSelect(oldWardSelectFields);

            const deleveryAddress = await queryBuilder.getOne();

            if (!deleveryAddress) {
                throw new BadRequestException({
                    message: 'Failed to get address',
                    code: ResponseCode.ADDRESS_NOT_FOUND
                });
            }

            return plainToInstance(DeliveryAddressDto, deleveryAddress, { excludeExtraneousValues: true })
        } catch (error) {
            this.logger.error(error.message);
            throw new InternalServerErrorException({
                message: 'Failed to get address',
                code: ResponseCode.FAILED_TO_GET_USER_ADDRESS
            });
        }
    }
}
