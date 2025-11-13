import {
    BlobServiceClient,
    StorageSharedKeyCredential,
    BlobSASPermissions,
} from '@azure/storage-blob';
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MediaGroupType } from '../enums/media-group-type.enum';
import { generateFileName } from '../utils/file.util';
import { ResponseCode } from 'src/common/constants/response-code.const';

@Injectable()
export class AzureBlobService {
    private readonly logger = new Logger(AzureBlobService.name);
    private blobServiceClient?: BlobServiceClient;

    constructor(private configService: ConfigService) {
        this.initializeBlobService();
    }

    private initializeBlobService() {
        const accountName = this.configService.get<string>(
            'AZURE_STORAGE_ACCOUNT_NAME',
        );
        const accountKey = this.configService.get<string>(
            'AZURE_STORAGE_ACCOUNT_KEY',
        );

        if (!accountName || !accountKey) {
            this.logger.warn('Azure Storage credentials not provided, this service is disabled');
            return;
        }

        this.blobServiceClient = new BlobServiceClient(
            `https://${accountName}.blob.core.windows.net`,
            new StorageSharedKeyCredential(
                accountName,
                accountKey,
            ),
        );
    }

    async uploadFile(file: Express.Multer.File, groupType: MediaGroupType, customName?: string,): Promise<string> {
        if (!this.blobServiceClient) {
            throw new InternalServerErrorException({
                message: "Azure Storage is disabled",
                code: ResponseCode.STORAGE_IS_DISABLED
            })
        }

        try {
            const containerName = this.getContainerName(groupType);
            const fileName = generateFileName(file, customName);

            // Get container client
            const containerClient = this.blobServiceClient.getContainerClient(containerName);

            // Create container if it doesn't exist
            await containerClient.createIfNotExists({
                // Remove public access since the storage account doesn't allow it
                // Files will be accessible via SAS tokens or authenticated requests
            });

            // Get blob client
            const blobClient = containerClient.getBlockBlobClient(fileName);

            // Set content type and metadata
            const options = {
                blobHTTPHeaders: {
                    blobContentType: file.mimetype,
                },
                metadata: {
                    originalName: file.originalname,
                    uploadedAt: new Date().toISOString(),
                    groupType: groupType,
                },
            };

            // Upload file
            const uploadResponse = await blobClient.upload(
                file.buffer,
                file.size,
                options,
            );

            if (uploadResponse.errorCode) {
                throw new Error(`Upload failed: ${uploadResponse.errorCode}`);
            }

            // Return the blob URL (will need SAS token for access if private)
            const fileUrl = blobClient.url;
            this.logger.log(`File uploaded successfully: ${fileUrl}`);

            return fileUrl;
        } catch (error) {
            this.logger.error(`File upload failed: ${error.message}`);
            throw new Error(`Failed to upload file: ${error.message}`);
        }
    }

    async deleteFile(fileUrl: string): Promise<boolean> {
        if (!this.blobServiceClient) {
            throw new InternalServerErrorException({
                message: "Azure Storage is disabled",
                code: ResponseCode.STORAGE_IS_DISABLED
            })
        }

        try {
            // Extract container and blob name from URL
            const urlParts = this.parseAzureUrl(fileUrl);
            if (!urlParts) {
                throw new Error('Invalid Azure blob URL');
            }

            const { containerName, blobName } = urlParts;

            const containerClient = this.blobServiceClient.getContainerClient(containerName);
            const blobClient = containerClient.getBlockBlobClient(blobName);

            const deleteResponse = await blobClient.deleteIfExists();

            if (deleteResponse.succeeded) {
                this.logger.log(`File deleted successfully: ${fileUrl}`);
                return true;
            } else {
                this.logger.warn(`File not found for deletion: ${fileUrl}`);
                return false;
            }
        } catch (error) {
            this.logger.error(`File deletion failed: ${error.message}`, error.stack);
            throw new Error(`Failed to delete file: ${error.message}`);
        }
    }

    async getFileInfo(fileUrl: string) {
        if (!this.blobServiceClient) {
            throw new InternalServerErrorException({
                message: "Azure Storage is disabled",
                code: ResponseCode.STORAGE_IS_DISABLED
            })
        }

        try {
            const urlParts = this.parseAzureUrl(fileUrl);
            if (!urlParts) {
                throw new Error('Invalid Azure blob URL');
            }

            const { containerName, blobName } = urlParts;

            const containerClient =
                this.blobServiceClient.getContainerClient(containerName);
            const blobClient = containerClient.getBlockBlobClient(blobName);

            const properties = await blobClient.getProperties();

            return {
                url: fileUrl,
                contentType: properties.contentType,
                contentLength: properties.contentLength,
                lastModified: properties.lastModified,
                metadata: properties.metadata,
            };
        } catch (error) {
            this.logger.error(
                `Failed to get file info: ${error.message}`,
                error.stack,
            );
            throw new Error(`Failed to get file info: ${error.message}`);
        }
    }

    private getContainerName(groupType: MediaGroupType): string {
        const prefix = this.configService.get<string>(
            'AZURE_CONTAINER_PREFIX',
            'farmera',
        );
        return `${prefix}-${groupType.toLowerCase()}`;
    }

    private parseAzureUrl(
        url: string,
    ): { containerName: string; blobName: string } | null {
        try {
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname
                .split('/')
                .filter((part) => part.length > 0);

            if (pathParts.length < 2) {
                return null;
            }

            const containerName = pathParts[0];
            const blobName = pathParts.slice(1).join('/');

            return { containerName, blobName };
        } catch (error) {
            this.logger.error(`Failed to parse Azure URL: ${url}`, error.stack);
            return null;
        }
    }

    async listFiles(groupType: MediaGroupType, prefix?: string) {
        if (!this.blobServiceClient) {
            throw new InternalServerErrorException({
                message: "Azure Storage is disabled",
                code: ResponseCode.STORAGE_IS_DISABLED
            })
        }

        try {
            const containerName = this.getContainerName(groupType);
            const containerClient =
                this.blobServiceClient.getContainerClient(containerName);

            const files: any = [];
            const options = prefix ? { prefix } : {};

            for await (const blob of containerClient.listBlobsFlat(options)) {
                files.push({
                    name: blob.name,
                    url: `${containerClient.url}/${blob.name}`,
                    contentType: blob.properties.contentType,
                    contentLength: blob.properties.contentLength,
                    lastModified: blob.properties.lastModified,
                });
            }

            return files;
        } catch (error) {
            this.logger.error(`Failed to list files: ${error.message}`, error.stack);
            throw new Error(`Failed to list files: ${error.message}`);
        }
    }

    // Generate SAS token for secure file access
    async generateSasUrl(fileUrl: string, expiresInHours: number = 24): Promise<string> {
        if (!this.blobServiceClient) {
            throw new InternalServerErrorException({
                message: "Azure Storage is disabled",
                code: ResponseCode.STORAGE_IS_DISABLED
            })
        }

        try {
            const urlParts = this.parseAzureUrl(fileUrl);
            if (!urlParts) {
                throw new Error('Invalid Azure blob URL');
            }

            const { containerName, blobName } = urlParts;
            const containerClient =
                this.blobServiceClient.getContainerClient(containerName);
            const blobClient = containerClient.getBlockBlobClient(blobName);

            // Generate SAS token for read access
            const sasOptions = {
                permissions: BlobSASPermissions.parse('r'), // read permission
                expiresOn: new Date(Date.now() + expiresInHours * 60 * 60 * 1000),
            };

            const sasUrl = await blobClient.generateSasUrl(sasOptions);
            return sasUrl;
        } catch (error) {
            this.logger.error(
                `Failed to generate SAS URL: ${error.message}`,
                error.stack,
            );
            throw new Error(`Failed to generate SAS URL: ${error.message}`);
        }
    }
}