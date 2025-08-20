import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';

@Injectable()
export class AppLogger implements LoggerService {
    private logger: winston.Logger;

    constructor() {
        this.logger = winston.createLogger({
            transports: [
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.colorize(),
                        winston.format.timestamp(),
                        winston.format.printf(({ timestamp, level, message }) => {
                            return `[${timestamp}] ${level}: ${message}`;
                        }),
                    ),
                }),
                new winston.transports.File({
                    filename: 'logs/combined.log',
                    level: 'info',
                }),
                new winston.transports.File({
                    filename: 'logs/errors.log',
                    level: 'error',
                }),
            ],
        });
    }

    log(message: string) {
        this.logger.info(message);
    }
    error(message: string, trace?: string) {
        this.logger.error(`${message} -> ${trace || ''}`);
    }
    warn(message: string) {
        this.logger.warn(message);
    }
    debug(message: string) {
        this.logger.debug(message);
    }
    verbose(message: string) {
        this.logger.verbose(message);
    }
}
