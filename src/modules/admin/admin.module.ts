import { Module } from '@nestjs/common';
import { FarmManagementService } from './farm-management/farm-management.service';
import { FarmModule } from '../farm/farm.module';
import { UserModule } from '../user/user.module';
import { FarmManagementController } from './farm-management/farm-management.controller';
import { UserController } from './user/user.controller';
import { UserService } from './user/user.service';

@Module({
  imports: [FarmModule, UserModule],
  controllers: [FarmManagementController, UserController],
  providers: [FarmManagementService, UserService]
})
export class AdminModule { }
