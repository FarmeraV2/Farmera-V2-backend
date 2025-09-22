import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from '../entities/location.entity';
import { CreateLocationDto } from '../dtos/user-location/create-location.dto';
import { UpdateLocationDto } from '../dtos/user-location/update-location.dto';

@Injectable()
export class UserLocationService {

    private readonly logger = new Logger(UserLocationService.name);

    constructor(
        @InjectRepository(Location) private readonly locationsRepository: Repository<Location>,
    ) { }

    /**
     * @function getUserLocations - Retrieves all locations of a specific user
     * @param {number} id - ID of the user
     * 
     * @returns {Promise<Location[]>} - List of locations associated with the user,
     * ordered with primary locations first and then by most recently created.
     *
     * @throws {InternalServerErrorException} - Thrown if an unexpected error occurs
     * during the retrieval process.
     */
    async getUserLocations(id: number): Promise<Location[]> {
        try {
            return await this.locationsRepository.find({
                where: { user: { id } },
                order: { is_primary: 'DESC', created_at: 'DESC' },
            });
        }
        catch (error) {
            this.logger.error(error.message);
            throw new InternalServerErrorException("Failed to get user locations");
        }
    }

    /**
     * @function addUserLocation - Adds a new location for a specific user
     * @param {number} id - UUID of the user to whom the location will be added
     * @param {CreateLocationDto} locationData - Data required to create the new location
     * 
     * @returns {Promise<Location>} - The newly created and saved location entity
     *
     * @throws {NotFoundException} - Thrown if the user does not exist when attempting to update existing locations 
     * @throws {InternalServerErrorException} - Thrown if saving the new location fails unexpectedly.
     */
    async addUserLocation(id: number, locationData: CreateLocationDto): Promise<Location> {
        try {
            if (locationData.is_primary) {
                await this.locationsRepository.update(
                    { user: { id } },
                    { is_primary: false },
                );
            }

            const newLocation = this.locationsRepository.create({
                user: { id },
                city: locationData.city,
                district: locationData.district,
                address_line: locationData.address_line,
                street: locationData.address_line,
                ward: locationData.ward,
                type: locationData.type,
                is_primary: locationData.is_primary || false,
                name: locationData.name,
                phone: locationData.phone,
            });

            const savedLocation = await this.locationsRepository.save(newLocation);
            return savedLocation;
        }
        catch (error) {
            this.logger.error(error.message);
            throw new InternalServerErrorException("Failed to add new user location");
        }
    }

    /**
     * @function updateUserLocation - Updates an existing location for a specific user
     * @param {number} userId - ID of the user whose location is being updated
     * @param {number} locationId - ID of the location to be updated
     * @param {UpdateLocationDto} locationData - Data to update the location with
     * 
     * @returns {Promise<Location | null>} - The updated location entity, or null if not found
     *
     * @throws {InternalServerErrorException} - Thrown if an unexpected error occurs
     * during the update process.
     */
    async updateUserLocation(userId: number, locationId: number, locationData: UpdateLocationDto): Promise<Location> {
        try {
            // If setting this as primary, unset other primary locations for this user
            if (locationData.is_primary) {
                await this.locationsRepository.update(
                    { user: { id: userId } },
                    { is_primary: false },
                );
            }

            await this.locationsRepository.update({ location_id: locationId, user: { id: userId } }, locationData);

            return this.getLocationById(locationId, userId);
        }
        catch (error) {
            this.logger.error(error.message);
            throw new InternalServerErrorException("Failed to update user location");
        }
    }

    async deleteUserLocation(userId: number, locationId: number) {
        const location = await this.locationsRepository.findOne({
            where: { location_id: locationId, user: { id: userId } },
        });

        if (!location) {
            throw new NotFoundException(`Location with ID ${locationId} not found`);
        }

        await this.locationsRepository.delete(locationId);
        return { success: true, message: 'Location deleted successfully' };
    }

    async getLocationById(locationId: number, userId: number): Promise<Location> {
        const location = await this.locationsRepository.findOne({
            where: { location_id: locationId, user: { id: userId } },
        });
        if (!location) {
            throw new NotFoundException("Location not found");
        }
        return location
    }
}
