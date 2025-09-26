import { Module } from '@nestjs/common';
import { AddressService } from './address/address.service';
import { AddressController } from './address/address.controller';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Province } from './entities/province.entity';
import { Ward } from './entities/ward.entity';
import { DeliveryAddressService } from './delivery-address/delivery-address.service';
import { DeliveryAddressController } from './delivery-address/delivery-address.controller';
import { DeliveryAddress } from './entities/delivery-address.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Province, Ward, DeliveryAddress]), HttpModule, ConfigModule],
    providers: [AddressService, DeliveryAddressService],
    controllers: [AddressController, DeliveryAddressController],
    exports: [DeliveryAddressService],
})
export class AddressModule {}
