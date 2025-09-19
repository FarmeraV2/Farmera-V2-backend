import { CallHandler, ExecutionContext, Injectable, NestInterceptor, } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RESPONSE_MESSAGE_KEY } from '../decorators/response-message.decorator';
import { SKIP_TRANSFORM_KEY } from '../decorators/skip.decorator';

export interface Response<T> {
    statusCode: number;
    message?: string;
    data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {

    constructor(private reflector: Reflector) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
        const skipTransform = this.reflector.getAllAndOverride<boolean>(
            SKIP_TRANSFORM_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (skipTransform) {
            return next.handle();
        }

        return next.handle().pipe(
            map((data) => ({
                statusCode: context.switchToHttp().getResponse().statusCode,
                message:
                    this.reflector.get<string>(
                        RESPONSE_MESSAGE_KEY,
                        context.getHandler(),
                    ) || '',
                data: data,
            })),
        );
    }
}