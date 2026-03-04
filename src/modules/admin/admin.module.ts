import { Module } from '@nestjs/common';
import { FarmManagementService } from './farm-management/farm-management.service';
import { FarmModule } from '../farm/farm.module';
import { UserModule } from '../user/user.module';
import { FarmManagementController } from './farm-management/farm-management.controller';
import { ProductManagementController } from './product-management/product-management.controller';
import { ProductManagementService } from './product-management/product-management.service';
import { UserManagementController } from './user-management/user-management.controller';
import { UserManagementService } from './user-management/user-management.service';
import { CropManagementController } from './crop-management/crop-management.controller';
import { CropManagementService } from './crop-management/crop-management.service';
import { CropManagementModule } from '../crop-management/crop-management.module';

@Module({
  imports: [FarmModule, UserModule, CropManagementModule],
  controllers: [FarmManagementController, UserManagementController, ProductManagementController, CropManagementController],
  providers: [FarmManagementService, UserManagementService, ProductManagementService, CropManagementService],
})
export class AdminModule { }
