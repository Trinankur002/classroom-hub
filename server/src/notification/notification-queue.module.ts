// src/queues/notification-queue.module.ts
import { Module } from '@nestjs/common';
import { NotificationModule } from './notification.module';
import { NotificationWorkerService } from './notification-worker.service';

@Module({
    imports: [NotificationModule],
    providers: [NotificationWorkerService],
    exports: [NotificationWorkerService],
})
export class NotificationQueueModule { }
