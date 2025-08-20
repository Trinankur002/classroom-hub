import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AppLogger } from './logger.service';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
    constructor(private readonly logger: AppLogger) { }

    use(req: Request, res: Response, next: NextFunction) {
        const { method, originalUrl } = req;
        const start = Date.now();

        res.on('finish', () => {
            const duration = Date.now() - start;
            const { statusCode } = res;
            this.logger.log(`${method} ${originalUrl} ${statusCode} - ${duration}ms`);
        });

        next();
    }
}
