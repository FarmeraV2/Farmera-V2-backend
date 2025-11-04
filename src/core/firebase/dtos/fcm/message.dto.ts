export class MessageDto {
    token: string;
    data?: Record<string, string>;
    title?: string;
    body?: string;
    imageUrl?: string;
}