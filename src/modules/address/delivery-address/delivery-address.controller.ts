import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { UserInterface } from 'src/common/types/user.interface';
import { User } from 'src/common/decorators/user.decorator';
import { DeliveryAddressService } from './delivery-address.service';
import { UpdateAddressDto } from '../dtos/update-address.dto';
import { CreateAddressDto } from '../dtos/create-address.dto';

@Controller('delivery-address')
export class DeliveryAddressController {

    constructor(private readonly deliveryAddressService: DeliveryAddressService) { }

    @Put(':locationId')
    async updateAddress(@User() user: UserInterface, @Param('locationId') locationId: number, @Body() req: UpdateAddressDto) {
        return await this.deliveryAddressService.updateUserAddress(user.id, locationId, req);
    }

    @Post()
    async createAddress(@User() user: UserInterface, @Body() req: CreateAddressDto) {
        return await this.deliveryAddressService.addUserAddress(user.id, req);
    }

    @Get()
    async getUserLocation(@User() user: UserInterface) {
        return await this.deliveryAddressService.getUserAddresses(user.id);
    }

    @Delete(':addressId')
    async deleteAddress(@User() user: UserInterface, @Param('addressId') addressId: number) {
        return await this.deliveryAddressService.deleteUserLocation(user.id, addressId);
    }
}
