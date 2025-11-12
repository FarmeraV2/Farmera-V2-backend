import { Module } from '@nestjs/common';
import { LocalStorageService } from './local-storage/local-storage.service';
import { LocalStorageController } from './local-storage/local-storage.controller';
import { MulterModule } from '@nestjs/platform-express';
import { multerAsyncConfig } from 'src/config/multer.config';
import { AzureBlobService } from './azure-blob/azure-blob.service';

@Module({
  imports: [
    MulterModule.registerAsync(multerAsyncConfig),
  ],
  providers: [LocalStorageService, AzureBlobService],
  controllers: [LocalStorageController]
})
export class FileStorageModule { }
