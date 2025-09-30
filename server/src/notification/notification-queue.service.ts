// src/notification/notification-queue.service.ts
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';
import connection from './bullmq.options';

@Injectable()
export class NotificationQueueService implements OnModuleDestroy {
    private queue: Queue;

    constructor() {
        this.queue = new Queue('notification-deliver', { connection });
    }

    async addDeliverJob(data: { userIds: string[]; type: string; payload: any }, opts?: any) {
        // job name 'deliver'
        await this.queue.add('deliver', data, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
            removeOnComplete: { age: 60 * 60 }, // seconds
            removeOnFail: { count: 1000 },
            ...opts,
        });
    }

    async close() {
        await this.queue.close();
    }

    async onModuleDestroy() {
        await this.close();
    }
}
