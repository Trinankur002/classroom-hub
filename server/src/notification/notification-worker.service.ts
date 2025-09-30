// src/notification/notification-worker.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import connection from './bullmq.options';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationService } from './notification.service';

@Injectable()
export class NotificationWorkerService implements OnModuleInit, OnModuleDestroy {
    private worker: Worker;
    private readonly logger = new Logger(NotificationWorkerService.name);

    constructor(
        private readonly notificationsGateway: NotificationsGateway,
        private readonly notificationService: NotificationService,
    ) { }

    onModuleInit() {
        this.worker = new Worker(
            'notification-deliver',
            async (job: Job) => {
                const { userIds, type, payload } = job.data as {
                    userIds: string[];
                    type: string;
                    payload: any;
                };

                if (Array.isArray(userIds)) {
                    const chunkSize = 200;
                    for (let i = 0; i < userIds.length; i += chunkSize) {
                        for (const userId of userIds.slice(i, i + chunkSize)) {
                            try {
                                this.notificationsGateway.emitToUser(userId, { type, payload });
                            } catch (err) {
                                this.logger.warn(`Failed to emit to ${userId}: ${err}`);
                            }
                        }
                    }
                }

                // Optionally use notificationService for DB persistence or push
            },
            { connection, concurrency: 10 },
        );

        this.worker.on('completed', (job) =>
            this.logger.debug(`Job ${job.id} completed`),
        );
        this.worker.on('failed', (job, err) =>
            this.logger.error(`Job ${job?.id} failed: ${err?.message || err}`),
        );
    }

    async onModuleDestroy() {
        await this.worker?.close();
    }
}
