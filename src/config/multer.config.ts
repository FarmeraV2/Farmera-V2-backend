import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModuleAsyncOptions } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { resolve } from 'path';
import { existsSync, mkdirSync } from 'fs';

export const multerAsyncConfig: MulterModuleAsyncOptions = {
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => {
        const uploadsDirectoryName = configService.get<string>('UPLOAD_DIR', 'uploads/temp');
        const baseUploadPath = resolve(process.cwd(), uploadsDirectoryName);

        if (!existsSync(baseUploadPath)) {
            mkdirSync(baseUploadPath, { recursive: true });
        }

        return {
            storage: diskStorage({
                destination: baseUploadPath,
            }),
        };
    },
};                   
