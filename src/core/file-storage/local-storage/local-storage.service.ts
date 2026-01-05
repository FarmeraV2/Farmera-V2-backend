import { HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { existsSync, mkdirSync } from "fs";
import path, { extname } from "path";
import { MediaGroupType } from "../enums/media-group-type.enum";
import * as fs from 'fs/promises';
import { ResponseCode } from "src/common/constants/response-code.const";
import { generateFileName } from "../utils/file.util";
import { FileStorageService } from "../interfaces/file-storage.interface";
import { lookup } from "mime-types";
import { HashService } from "src/services/hash.service";
import { bool } from "aws-sdk/clients/signer";

const SUB_URL = "api/file-storage";
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.flv'];

@Injectable()
export class LocalStorageService implements FileStorageService {
    private readonly logger = new Logger(LocalStorageService.name);
    private readonly baseUploadPath: string;
    private readonly baseUrl: string;
    private readonly appUrl: string;
    private readonly encryptionKey?: Buffer<ArrayBuffer>;

    constructor(
        private readonly configService: ConfigService,
        private readonly hashService: HashService,
    ) {
        const uploadsDirectoryName = this.configService.get<string>('UPLOAD_DIR', 'uploads');
        this.baseUploadPath = path.resolve(process.cwd(), uploadsDirectoryName);
        this.baseUrl = this.configService.get<string>('FILE_BASE_URL', 'uploads');
        this.appUrl = this.configService.get<string>('APP_URL', 'localhost:3000')
        const encryptKey = this.configService.get<string>('FILE_ENCRYPTION_KEY')

        if (this.baseUrl.endsWith('/')) {
            this.baseUrl = this.baseUrl.slice(0, -1);
        }

        if (!existsSync(this.baseUploadPath)) {
            mkdirSync(this.baseUploadPath, { recursive: true });
        }

        if (!encryptKey) {
            this.logger.warn('Private storage will be disable');
            return;
        }
        this.encryptionKey = Buffer.from(encryptKey, 'hex');
    }

    async uploadFile(temporaryFiles: Express.Multer.File[], type: MediaGroupType, subPath?: string, privateFile?: boolean): Promise<string[]> {
        if (!temporaryFiles || temporaryFiles.length === 0) return [];

        const absoluteDestinationDir = privateFile ?
            path.join(this.baseUploadPath, 'private', type, subPath || '') :
            path.join(this.baseUploadPath, type, subPath || '')

        const results: string[] = [];
        const successfullyMovedFilesPaths: string[] = [];

        try {
            await fs.mkdir(absoluteDestinationDir, { recursive: true });
        } catch (error) {
            if (error.code !== 'EEXIST') {
                this.logger.error(`Error creating dir ${absoluteDestinationDir}: ${error.message}`);
                throw new InternalServerErrorException({
                    message: "Failed to save file",
                    code: ResponseCode.FAILED_TO_UPLOAD_FILE
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
                if (privateFile) {
                    if (!this.encryptionKey) {
                        throw new Error('Can not encrypt without key');
                    }

                    const fileBuffer = await fs.readFile(tempFile.path);
                    const { encrypted, iv, tag } = this.hashService.encryptFileBuffer(fileBuffer, this.encryptionKey);

                    const payload = Buffer.concat([iv, tag, encrypted]);
                    await fs.writeFile(finalAbsolutePath, payload);

                    await fs.unlink(tempFile.path);
                } else {
                    await fs.rename(tempFile.path, finalAbsolutePath);
                }

                const relativePathFragment = path.relative(this.baseUploadPath, finalAbsolutePath);
                const urlPath = relativePathFragment.replace(/\\/g, '/');
                const finalUrl = privateFile ?
                    `${urlPath}` :
                    `${this.appUrl}/${SUB_URL}/${this.baseUrl}/${urlPath}`;

                results.push(finalUrl);

                successfullyMovedFilesPaths.push(finalAbsolutePath);

            } catch (error) {
                this.logger.error(`Upload file error: ${error.message}`);
                await this.deleteByIdentifiers(successfullyMovedFilesPaths);

                try { await fs.unlink(tempFile.path); } catch (e) { }

                throw new InternalServerErrorException({
                    message: "Failed to save file",
                    code: ResponseCode.FAILED_TO_UPLOAD_FILE
                });
            }
        }

        return results;
    }

    async serveFile(url: string, privateFile?: bool): Promise<{
        buffer?: Buffer;
        filePath?: string;
        isVideo: boolean;
        mimeType: string;
    }> {
        const { absolutePath, isVideo, mimeType } = await this.getFilePath(url);

        // todo!("handle video")
        // if (isVideo) {
        //     return { filePath: absolutePath, isVideo, mimeType };
        // }

        const buffer = await fs.readFile(absolutePath);

        if (privateFile) {
            if (!this.encryptionKey) {
                throw new InternalServerErrorException({
                    message: 'Failed to serve file',
                    code: ResponseCode.INTERNAL_ERROR
                });
            }
            const decrypted = this.hashService.decryptFileBuffer(buffer, this.encryptionKey);
            return { buffer: decrypted, isVideo, mimeType };;
        }

        return { buffer, isVideo, mimeType };
    }

    async deleteByUrls(urls: string[]): Promise<string[]> {
        if (!urls || urls.length === 0) return [];

        const pathsToDelete = urls.map(url => this.getAbsolutePathFromUrl(url))
            .filter((p): p is string => !!p);

        if (pathsToDelete.length > 0) {
            return await this.deleteByIdentifiers(pathsToDelete);
        }
        return [];
    }


    private async deleteByIdentifiers(absoluteFilePaths: string[]): Promise<string[]> {
        if (!absoluteFilePaths || absoluteFilePaths.length === 0) return [];

        const deletedPaths: string[] = [];

        const deletionPromises = absoluteFilePaths.map(async (filePath) => {
            const trimmedPath = filePath?.trim();
            if (!trimmedPath) return Promise.resolve();
            try {
                await fs.unlink(trimmedPath);
                deletedPaths.push(trimmedPath);
            } catch (error) {
                if (error.code !== 'ENOENT') {
                    this.logger.error(`Error deleting "${trimmedPath}": ${error.message}`);
                } else {
                    this.logger.warn(`File path not found: ${trimmedPath}`);
                }
            }
        });

        await Promise.all(deletionPromises);
        return deletedPaths;
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

    private async getFilePath(url: string): Promise<{
        absolutePath: string;
        isVideo: boolean;
        mimeType: string;
    }> {
        const absolutePath = this.getAbsolutePathFromUrl(url);
        if (!absolutePath) {
            throw new NotFoundException({
                message: `File path could not be resolved from URL: ${url}`,
                code: ResponseCode.FILE_PATH_NOT_FOUND,
            });
        }

        try {
            const stats = await fs.stat(absolutePath);
            if (!stats.isFile()) {
                throw new NotFoundException({
                    message: `Path is not a file: ${url}`,
                    code: ResponseCode.FILE_NOT_FOUND,
                });
            }

            const ext = extname(absolutePath).toLowerCase();
            const isVideo = VIDEO_EXTENSIONS.includes(ext);
            const mimeType = lookup(ext) || 'application/octet-stream';

            return { absolutePath, isVideo, mimeType };

        } catch (error) {
            if (error instanceof HttpException) throw error;

            this.logger.error(`Error accessing file: ${error.message}`);
            throw new NotFoundException({
                message: `Unable to access file: ${url}`,
                code: ResponseCode.FAILED_TO_READ_FILE,
            });
        }
    }

    /**DEPRECATED */
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
