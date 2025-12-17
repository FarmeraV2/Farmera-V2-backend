import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger(LoggingInterceptor.name);

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const req = context.switchToHttp().getRequest();
        const { method, url, body, query, params } = req;

        this.logger.debug(
            `Method: ${method} Url: ${url} ` +
            `Body: ${JSON.stringify(body)} ` +
            `Query: ${JSON.stringify(query)} ` +
            `Params: ${JSON.stringify(params)}`
        );

        return next.handle();
    }
}
