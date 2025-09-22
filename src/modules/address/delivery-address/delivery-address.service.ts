import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from "typeorm";
import { DeliveryAddress } from '../entities/delivery-address.entity';
import { CreateAddressDto } from '../dtos/create-address.dto';
import { UpdateAddressDto } from '../dtos/update-address.dto';

@Injectable()
export class DeliveryAddressService {

    private readonly logger = new Logger(DeliveryAddressService.name);

    constructor(
        @InjectRepository(DeliveryAddress) private readonly deliveryAddressRepository: Repository<DeliveryAddress>,
    ) { }

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
        }
        catch (error) {
            this.logger.error(error.message);
            throw new InternalServerErrorException("Failed to get user addresses");
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
                await this.deliveryAddressRepository.update(
                    { user: { id } },
                    { is_primary: false },
                );
            }

            const newLocation = this.deliveryAddressRepository.create({
                user: { id },
                name: locationData.name,
                phone: locationData.phone,
                province_code: locationData.province_code,
                ward_code: locationData.ward_code,
                street: locationData.address_line,
                address_line: locationData.address_line,
                type: locationData.type,
                is_primary: locationData.is_primary || false,
            });

            const savedLocation = await this.deliveryAddressRepository.save(newLocation);
            return savedLocation;
        }
        catch (error) {
            this.logger.error(error.message);
            throw new InternalServerErrorException("Failed to add new user address");
        }
    }

    /**
     * @function updateUserAddress - Updates an existing location for a specific user
     * @param {number} userId - ID of the user whose location is being updated
     * @param {number} locationId - ID of the location to be updated
     * @param {UpdateAddressDto} locationData - Data to update the location with
     *
     * @returns {Promise<DeliveryAddress | null>} - The updated location entity, or null if not found
     *
     * @throws {InternalServerErrorException} - Thrown if an unexpected error occurs
     * during the update process.
     */
    async updateUserAddress(userId: number, locationId: number, locationData: UpdateAddressDto): Promise<DeliveryAddress> {
        try {
            // If setting this as primary, unset other primary locations for this user
            if (locationData.is_primary) {
                await this.deliveryAddressRepository.update(
                    { user: { id: userId } },
                    { is_primary: false },
                );
            }

            await this.deliveryAddressRepository.update({ location_id: locationId, user: { id: userId } }, locationData);

            return this.getAddressById(locationId, userId);
        }
        catch (error) {
            this.logger.error(error.message);
            throw new InternalServerErrorException("Failed to update user address");
        }
    }

    async deleteUserLocation(userId: number, locationId: number) {
        const location = await this.deliveryAddressRepository.findOne({
            where: { location_id: locationId, user: { id: userId } },
        });

        if (!location) {
            throw new NotFoundException(`Location with ID ${locationId} not found`);
        }

        await this.deliveryAddressRepository.delete(locationId);
        return { success: true, message: 'Location deleted successfully' };
    }

    async getAddressById(locationId: number, userId: number): Promise<DeliveryAddress> {
        const location = await this.deliveryAddressRepository.findOne({
            where: { location_id: locationId, user: { id: userId } },
        });
        if (!location) {
            throw new NotFoundException("Address not found");
        }
        return location
    }
}
