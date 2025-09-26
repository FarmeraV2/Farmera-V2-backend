import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeliveryAddress } from '../entities/delivery-address.entity';
import { CreateAddressDto, CreateFarmAddressDto } from '../dtos/create-address.dto';
import { UpdateAddressDto } from '../dtos/update-address.dto';
import { AddressType } from '../enums/address-type.enums';

@Injectable()
export class DeliveryAddressService {
    private readonly logger = new Logger(DeliveryAddressService.name);

    constructor(@InjectRepository(DeliveryAddress) private readonly deliveryAddressRepository: Repository<DeliveryAddress>) {}

    /**
     * @function getUserAddresses - Retrieves all addresses of a specific user
     * @param {number} id - ID of the user
     *
     * @returns {Promise<DeliveryAddress[]>} - List of addresses associated with the user,
     * ordered with primary locations first and then by most recently created.
     *
     * @throws {InternalServerErrorException} - Thrown if an unexpected error occurs
     * during the retrieval process.
     */
    async getUserAddresses(id: number): Promise<DeliveryAddress[]> {
        try {
            return await this.deliveryAddressRepository.find({
                where: { user: { id } },
                order: { is_primary: 'DESC', created_at: 'DESC' },
            });
        } catch (error) {
            this.logger.error(error.message);
            throw new InternalServerErrorException('Failed to get user addresses');
        }
    }

    /**
     * @function addUserAddress - Adds a new location for a specific user
     * @param {number} id - UUID of the user to whom the location will be added
     * @param {CreateAddressDto} locationData - Data required to create the new location
     *
     * @returns {Promise<DeliveryAddress>} - The newly created and saved address entity
     *
     * @throws {NotFoundException} - Thrown if the user does not exist when attempting to update existing locations
     * @throws {InternalServerErrorException} - Thrown if saving the new location fails unexpectedly.
     */
    async addUserAddress(id: number, locationData: CreateAddressDto): Promise<DeliveryAddress> {
        try {
            if (locationData.is_primary) {
                await this.deliveryAddressRepository.update({ user: { id } }, { is_primary: false });
            }

            const newLocation = this.deliveryAddressRepository.create({
                ...locationData,
                user: { id },
            });

            const savedLocation = await this.deliveryAddressRepository.save(newLocation);
            return savedLocation;
        } catch (error) {
            this.logger.error(error.message);
            throw new InternalServerErrorException('Failed to add new user address');
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
            throw new InternalServerErrorException('Failed to add new farm address');
        }
    }

    /**
     * @function updateUserAddress - Updates an existing location for a specific user
     * @param {number} userId - ID of the user whose location is being updated
     * @param {number} addressId - ID of the address to be updated
     * @param {UpdateAddressDto} locationData - Data to update the location with
     *
     * @returns {Promise<DeliveryAddress | null>} - The updated location entity, or null if not found
     *
     * @throws {InternalServerErrorException} - Thrown if an unexpected error occurs
     * during the update process.
     */
    async updateUserAddress(userId: number, addressId: number, locationData: UpdateAddressDto): Promise<DeliveryAddress> {
        try {
            // If setting this as primary, unset other primary locations for this user
            if (locationData.is_primary) {
                await this.deliveryAddressRepository.update({ user: { id: userId } }, { is_primary: false });
            }

            await this.deliveryAddressRepository.update({ address_id: addressId, user: { id: userId } }, locationData);

            return this.getAddressById(addressId, userId);
        } catch (error) {
            this.logger.error(error.message);
            throw new InternalServerErrorException('Failed to update user address');
        }
    }

    async deleteUserLocation(userId: number, addressId: number) {
        const location = await this.deliveryAddressRepository.findOne({
            where: { address_id: addressId, user: { id: userId } },
        });

        if (!location) {
            throw new NotFoundException(`Location with ID ${addressId} not found`);
        }

        await this.deliveryAddressRepository.delete({ address_id: addressId });
        return { success: true, message: 'Location deleted successfully' };
    }

    async getAddressById(addressId: number, userId: number): Promise<DeliveryAddress> {
        const location = await this.deliveryAddressRepository.findOne({
            where: { address_id: addressId, user: { id: userId } },
        });
        if (!location) {
            throw new NotFoundException('Address not found');
        }
        return location;
    }
}
