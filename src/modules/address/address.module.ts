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
import { OldProvince } from './entities/old-province.entity';
import { OldDistrict } from './entities/old-district.entity';
import { OldWard } from './entities/old-ward.entity';
import { OldAddressService } from './old-address/old-address.service';
import { OldAddressController } from './old-address/old-address.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([Province, Ward, DeliveryAddress, OldProvince, OldDistrict, OldWard]),
        HttpModule,
        ConfigModule
    ],
    providers: [AddressService, DeliveryAddressService, OldAddressService],
    controllers: [AddressController, DeliveryAddressController, OldAddressController],
    exports: [DeliveryAddressService],
})
export class AddressModule { }
