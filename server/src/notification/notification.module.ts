// src/notification/notification.module.ts
import { Module, forwardRef } from '@nestjs/common'; // Import forwardRef
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './notification.entity';
import { NotificationService } from './notification.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { JwtModule } from '@nestjs/jwt';
import { NotificationQueueService } from './notification-queue.service';
import { NotificationWorkerService } from './notification-worker.service';
import { ClassroomsModule } from 'src/classrooms/classrooms.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Notification]),
        forwardRef(() => ClassroomsModule),
        JwtModule.register({}),
    ],
    providers: [
        NotificationService,
        NotificationsGateway,
        NotificationQueueService,
        NotificationWorkerService,
    ],
    controllers: [NotificationsController],
    exports: [NotificationService, NotificationQueueService],
})
export class NotificationModule { }