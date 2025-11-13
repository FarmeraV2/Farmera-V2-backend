import { HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { existsSync, mkdirSync } from "fs";
import path from "path";
import { MediaGroupType } from "../enums/media-group-type.enum";
import { SavedFileResult } from "../interfaces/save-file-result.interface";
import * as fs from 'fs/promises';
import { ResponseCode } from "src/common/constants/response-code.const";
import { generateFileName } from "../utils/file.util";

const SUB_URL = "api/local-storage";

@Injectable()
export class LocalStorageService {
    private readonly logger = new Logger(LocalStorageService.name);
    private readonly baseUploadPath: string;
    private readonly baseUrl: string;
    private readonly appUrl: string;

    constructor(private readonly configService: ConfigService) {
        const uploadsDirectoryName = this.configService.get<string>('UPLOAD_DIR', 'uploads');
        this.baseUploadPath = path.resolve(process.cwd(), uploadsDirectoryName);
        this.baseUrl = this.configService.get<string>('FILE_BASE_URL', 'uploads');
        this.appUrl = this.configService.get<string>('APP_URL', 'localhost:3000')

        if (this.baseUrl.endsWith('/')) {
            this.baseUrl = this.baseUrl.slice(0, -1);
        }

        if (!existsSync(this.baseUploadPath)) {
            mkdirSync(this.baseUploadPath, { recursive: true });
        }
    }

    private getAbsolutePathFromUrl(url: string): string | null {
        const trimmedUrl = url?.trim();
        if (!trimmedUrl || !trimmedUrl.startsWith(this.baseUrl)) { return null; }
        let filePathFragment = trimmedUrl.substring(this.baseUrl.length);
        if (filePathFragment.startsWith('/') || filePathFragment.startsWith('\\')) {
            filePathFragment = filePathFragment.substring(1);
        }
        try { filePathFragment = decodeURIComponent(filePathFragment); } catch (e) { /* Ignore */ }
        return path.join(this.baseUploadPath, filePathFragment);
    }

    async saveFiles(temporaryFiles: Express.Multer.File[], type: MediaGroupType, subPath?: string): Promise<SavedFileResult[]> {
        if (!temporaryFiles || temporaryFiles.length === 0) return [];

        const absoluteDestinationDir = path.join(this.baseUploadPath, type, subPath || '')

        const results: SavedFileResult[] = [];
        const successfullyMovedFilesPaths: string[] = [];

        try {
            await fs.mkdir(absoluteDestinationDir, { recursive: true });
        } catch (error) {
            if (error.code !== 'EEXIST') {
                this.logger.error(`Error creating dir ${absoluteDestinationDir}: ${error.message}`);
                throw new InternalServerErrorException({
                    message: "Failed to save file",
                    code: ResponseCode.FAILED_TO_SAVE_FILE
                });
            }
        }

        for (const tempFile of temporaryFiles) {
            if (!tempFile || !tempFile.originalname) {
                this.logger.error('Invalid file object!', { tempFile });
                await this.deleteByIdentifiers(successfullyMovedFilesPaths);
            }

            const finalFilename = generateFileName(tempFile);
            const finalAbsolutePath = path.join(absoluteDestinationDir, finalFilename);

            try {
                await fs.rename(tempFile.path, finalAbsolutePath);

                const relativePathFragment = path.relative(this.baseUploadPath, finalAbsolutePath);
                const urlPath = relativePathFragment.replace(/\\/g, '/');
                const finalUrl = `${this.appUrl}/${SUB_URL}/${this.baseUrl}/${urlPath}`;

                results.push({
                    url: finalUrl,
                    storageType: 'local',
                    originalName: tempFile.originalname,
                });

                successfullyMovedFilesPaths.push(finalAbsolutePath);

            } catch (moveError) {
                this.logger.error(`Error moving ${tempFile.originalname} to ${finalAbsolutePath}: ${moveError.message}`);
                await this.deleteByIdentifiers(successfullyMovedFilesPaths);

                try { await fs.unlink(tempFile.path); } catch (e) { }

                throw new InternalServerErrorException({
                    message: "Failed to save file",
                    code: ResponseCode.FAILED_TO_SAVE_FILE
                });
            }
        }

        return results;
    }

    private async deleteByIdentifiers(absoluteFilePaths: string[]): Promise<boolean> {
        if (!absoluteFilePaths || absoluteFilePaths.length === 0) return false;

        const deletionPromises = absoluteFilePaths.map(async (filePath) => {
            const trimmedPath = filePath?.trim();
            if (!trimmedPath) return Promise.resolve();
            try {
                await fs.unlink(trimmedPath);
            } catch (error) {
                if (error.code !== 'ENOENT') {
                    this.logger.error(`Error deleting "${trimmedPath}": ${error.message}`);
                } else {
                    this.logger.warn(`File path not found: ${trimmedPath}`);
                }
            }
        });

        await Promise.all(deletionPromises);
        return true;
    }

    async deleteByUrls(urls: string[]): Promise<boolean> {
        if (!urls || urls.length === 0) return false;

        const pathsToDelete = urls.map(url => this.getAbsolutePathFromUrl(url))
            .filter((p): p is string => !!p);

        if (pathsToDelete.length > 0) {
            return await this.deleteByIdentifiers(pathsToDelete);
        }
        return false;
    }

    async getFile(url: string): Promise<Buffer> {
        const absolutePath = this.getAbsolutePathFromUrl(url);
        if (!absolutePath) {
            throw new NotFoundException({
                message: `File path could not be resolved from URL: ${url}`,
                code: ResponseCode.FILE_PATH_NOT_FOUND,
            });
        }

        try {
            const fileExists = await fs.stat(absolutePath).then(() => true).catch(() => false);
            if (!fileExists) {
                throw new NotFoundException({
                    message: `File not found`,
                    code: ResponseCode.FILE_NOT_FOUND,
                });
            }

            const fileBuffer = await fs.readFile(absolutePath);
            return fileBuffer;

        } catch (error) {
            if (error instanceof HttpException) throw error;
            this.logger.error(`Error reading file: `, error.message);
            throw new NotFoundException({
                message: `Unable to read file: ${url}`,
                code: ResponseCode.FAILED_TO_READ_FILE
            });
        }
    }
}
