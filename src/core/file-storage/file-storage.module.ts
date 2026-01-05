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
import { HashService } from 'src/services/hash.service';

const fileStorageProvider: Provider = {
  provide: 'FileStorageService',
  useFactory: (configService: ConfigService, hashService: HashService) => {
    const storageType = configService.get<string>('STORAGE_TYPE');
    if (storageType === 'R2') {
      return new CloudflareR2Service(configService, hashService);
    } else if (storageType === 'LOCAL') {
      return new LocalStorageService(configService, hashService);
    }
    throw new Error(`Unknown storage type: ${storageType}`);
  },
  inject: [ConfigService, HashService],
};

@Module({
  imports: [
    MulterModule.registerAsync(multerAsyncConfig),
  ],
  providers: [fileStorageProvider, PinataService, AzureBlobService, HashService],
  controllers: [PinataController, AzureBlobController, FileStorageController],
  exports: [fileStorageProvider]
})
export class FileStorageModule { }
