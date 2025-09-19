import { Module } from '@nestjs/common';
import { UserController } from './user/user.controller';
import { UserService } from './user/user.service';
import { UserLocationController } from './user-location/user-location.controller';
import { UserLocationService } from './user-location/user-location.service';
import { PaymentMethodController } from './payment-method/payment-method.controller';
import { PaymentMethodService } from './payment-method/payment-method.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Location } from './entities/location.entity';
import { PaymentMethod } from './entities/payment-method.entity';
import { HashService } from 'src/services/hash.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Location, PaymentMethod])
    ],
    controllers: [UserController, UserLocationController, PaymentMethodController],
    providers: [UserService, UserLocationService, PaymentMethodService, HashService],
    exports: [UserService]
})
export class UserModule { }
