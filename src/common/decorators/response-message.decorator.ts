import { SetMetadata } from '@nestjs/common';

/**
 * Attach the response message to the response
 *
 * Gán response message vào response
 */
export const RESPONSE_MESSAGE_KEY = 'response_message';
export const ResponseMessage = (message: string) => SetMetadata(RESPONSE_MESSAGE_KEY, message);
