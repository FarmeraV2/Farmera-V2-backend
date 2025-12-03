import { Module, Provider } from '@nestjs/common';
import { LocalStorageService } from './local-storage/local-storage.service';
import { MulterModule } from '@nestjs/platform-express';
import { multerAsyncConfig } from 'src/config/multer.config';
import { PinataService } from './pinata/pinata.service';
import { PinataController } from './pinata/pinata.controller';
import { AzureBlobController } from './azure-blob/azure-blob.controller';
import { ConfigService } from '@nestjs/config';
import { CloudflareR2Service } from './cloudflare-r2/cloudflare-r2.service';
import { FileStorageController } from './file-storage/file-storage.controller';
import { AzureBlobService } from './azure-blob/azure-blob.service';

const fileStorageProvider: Provider = {
  provide: 'FileStorageService',
  useFactory: (configService: ConfigService) => {
    const storageType = configService.get<string>('STORAGE_TYPE');
    if (storageType === 'R2') {
      return new CloudflareR2Service(configService);
    } else if (storageType === 'LOCAL') {
      return new LocalStorageService(configService);
    }
    throw new Error(`Unknown storage type: ${storageType}`);
  },
  inject: [ConfigService],
};

@Module({
  imports: [
    MulterModule.registerAsync(multerAsyncConfig),
  ],
  providers: [fileStorageProvider, PinataService, AzureBlobService],
  controllers: [PinataController, AzureBlobController, FileStorageController],
  exports: [fileStorageProvider]
})
export class FileStorageModule { }
