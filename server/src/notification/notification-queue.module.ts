// src/queues/notification-queue.module.ts
import { Module } from '@nestjs/common';
import { NotificationWorkerService } from './notification-worker.service';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationService } from './notification.service';

@Module({
    providers: [NotificationWorkerService, NotificationsGateway, NotificationService],
    exports: [NotificationWorkerService],
})
export class NotificationQueueModule { }
