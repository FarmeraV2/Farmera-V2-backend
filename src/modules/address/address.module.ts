import { Module, Provider, OnModuleInit } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
import { NewAddressService } from './new-address/new-address.service';
import { NewAddressController } from './new-address/new-address.controller';
import { GHNService } from './ghn/ghn.service';
import { ModuleRef } from '@nestjs/core';

@Module({
    imports: [
        TypeOrmModule.forFeature([Province, Ward, DeliveryAddress, OldProvince, OldDistrict, OldWard]),
        HttpModule,
        ConfigModule
    ],
    providers: [DeliveryAddressService, OldAddressService, NewAddressService, GHNService],
    controllers: [DeliveryAddressController, NewAddressController, OldAddressController],
    exports: [DeliveryAddressService, GHNService, OldAddressService],
})
export class AddressModule implements OnModuleInit {
    constructor(
        private moduleRef: ModuleRef,
    ) {}

    onModuleInit() {
        // Inject GHNService vào OldAddressService sau khi module được khởi tạo
        const oldAddressService = this.moduleRef.get(OldAddressService, { strict: false });
        const ghnService = this.moduleRef.get(GHNService, { strict: false });
        oldAddressService.setGhnService(ghnService);
    }
}
