import { bool } from "aws-sdk/clients/signer";
import { MediaGroupType } from "../enums/media-group-type.enum";
import { StoragePermission } from "../enums/storage-permission.enum";

export interface FileStorageService {
    uploadFile(
        body: Buffer | Express.Multer.File | Express.Multer.File[],
        typeOrKey?: MediaGroupType | string,
        subPath?: string,
        privateFile?: bool
    ): Promise<string[]>

    serveFile?(url: string, privateFile?: bool): Promise<{
        buffer?: Buffer;
        filePath?: string;
        isVideo: boolean;
        mimeType: string;
    }>

    getSignedUrl?(key: string, permission: StoragePermission): Promise<string>

    deleteByUrls?(urls: string[]): Promise<string[]>
}