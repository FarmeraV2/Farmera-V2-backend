import { MediaGroupType } from "../enums/media-group-type.enum";
import { StoragePermission } from "../enums/storage-permission.enum";

export interface FileStorageService {
    uploadFile(
        body: Buffer | string | Express.Multer.File | Express.Multer.File[],
        typeOrKey?: MediaGroupType | string,
        subPath?: string,
        contentType?: string
    ): Promise<string[]>

    getFile?(url: string): Promise<Buffer>
    getFilePath(url: string): Promise<{
        absolutePath: string;
        isVideo: boolean;
        mimeType: string;
    }>
    getSignedUrl?(key: string, permission: StoragePermission): Promise<string>

    deleteByUrls?(urls: string[]): Promise<string[]>
}