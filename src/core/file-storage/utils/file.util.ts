import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export function generateFileName(file: Express.Multer.File, customName?: string): string {
    const timestamp = Date.now();
    const uuid = uuidv4();
    const extension = this.getFileExtension(file.originalname);

    if (customName) {
        return `${customName}-${timestamp}-${uuid}${extension}`;
    }

    const baseName = file.originalname.replace(/\.[^/.]+$/, ''); // Remove extension
    return `${baseName}-${timestamp}-${uuid}${extension}`;
}

export function getFileExtension(filename: string) {
    return path.extname(filename).toLowerCase();
}