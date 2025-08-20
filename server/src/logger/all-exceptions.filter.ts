import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppLogger } from './logger.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    constructor(private readonly logger: AppLogger) { }

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const message =
            exception instanceof HttpException
                ? exception.getResponse()
                : (exception as any).toString();

        this.logger.error(
            `Error ${status} on ${request.method} ${request.url}: ${message}`,
        );

        response.status(status).json({
            statusCode: status,
            path: request.url,
            error: message,
        });
    }
}
