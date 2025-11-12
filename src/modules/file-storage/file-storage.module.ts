import { Module } from '@nestjs/common';
import { LocalStorageService } from './local-storage/local-storage.service';
import { LocalStorageController } from './local-storage/local-storage.controller';
import { MulterModule } from '@nestjs/platform-express';
import { multerAsyncConfig } from 'src/config/multer.config';

@Module({
  imports: [
    MulterModule.registerAsync(multerAsyncConfig),
  ],
  providers: [LocalStorageService],
  controllers: [LocalStorageController]
})
export class FileStorageModule { }
