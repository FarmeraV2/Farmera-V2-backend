import { ArgumentsHost, BadRequestException, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import { Response } from "express";
import { ResponseCode } from "../constants/response-code.const";

export class GlobalExceptionFilter implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let code = ResponseCode.INTERNAL_ERROR;
        let message = "Internal server error";

        if (exception instanceof HttpException) {
            status = exception.getStatus();

            const res = exception.getResponse();

            // exception from validator
            if (exception instanceof BadRequestException && Array.isArray((res as any).message)) {
                return response.status(HttpStatus.BAD_REQUEST).json({
                    statusCode: HttpStatus.BAD_REQUEST,
                    code: ResponseCode.FAILED_TO_VALIDATE,
                    message: (res as Record<string, any>).message
                });
            }

            // exception from services
            if (typeof res === "object" && res !== null) {
                const r = res as Record<string, any>;
                message = r.message || message;
                code = r.code || code;
            } else if (typeof res === "string") {
                message = res;
            }
        }

        response.status(status).json({
            statusCode: status,
            code,
            message
        });
    }
}