import { Module } from '@nestjs/common';
import { LocalStorageService } from './local-storage/local-storage.service';
import { LocalStorageController } from './local-storage/local-storage.controller';
import { MulterModule } from '@nestjs/platform-express';
import { multerAsyncConfig } from 'src/config/multer.config';
import { AzureBlobService } from './azure-blob/azure-blob.service';
import { PinataService } from './pinata/pinata.service';
import { PinataController } from './pinata/pinata.controller';

@Module({
  imports: [
    MulterModule.registerAsync(multerAsyncConfig),
  ],
  providers: [LocalStorageService, AzureBlobService, PinataService],
  controllers: [LocalStorageController, PinataController]
})
export class FileStorageModule { }
