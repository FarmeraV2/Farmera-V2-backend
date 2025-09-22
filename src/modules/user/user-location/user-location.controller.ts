import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { UserLocationService } from './user-location.service';
import { UserInterface } from 'src/common/types/user.interface';
import { User } from 'src/common/decorators/user.decorator';
import { CreateLocationDto } from '../dtos/user-location/create-location.dto';
import { UpdateLocationDto } from '../dtos/user-location/update-location.dto';

@Controller('user-location')
export class UserLocationController {

    constructor(private readonly userLocationService: UserLocationService) { }

    @Put(':locationId')
    async updateAddress(
        @User() user: UserInterface,
        @Param('locationId') locationId: number,
        @Body() req: UpdateLocationDto,
    ) {
        return await this.userLocationService.updateUserLocation(user.id, locationId, req);
    }

    @Post()
    async createAddress(@User() user: UserInterface, @Body() req: CreateLocationDto) {
        return await this.userLocationService.addUserLocation(user.id, req);
    }

    @Get()
    async getUserLocation(@User() user: UserInterface) {
        return await this.userLocationService.getUserLocations(user.id);
    }

    @Delete(':locationId')
    async deleteAddress(@User() user: UserInterface, @Param('locationId') locationId: number) {
        return await this.userLocationService.deleteUserLocation(user.id, locationId);
    }
}
