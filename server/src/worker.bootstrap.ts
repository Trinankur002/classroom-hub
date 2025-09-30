// src/worker.bootstrap.ts
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { NotificationQueueModule } from './notification/notification-queue.module';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(NotificationQueueModule);
    const logger = new Logger('worker.bootstrap');
    logger.log('Notification worker started');

    // app stays alive to keep Worker listening
}

bootstrap().catch((err) => {
    console.error(err);
    process.exit(1);
});
