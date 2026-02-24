import { Module } from '@nestjs/common';
import { FarmManagementService } from './farm-management/farm-management.service';
import { FarmModule } from '../farm/farm.module';
import { UserModule } from '../user/user.module';
import { FarmManagementController } from './farm-management/farm-management.controller';

@Module({
  imports: [FarmModule, UserModule],
  controllers: [FarmManagementController],
  providers: [FarmManagementService]
})
export class AdminModule { }
