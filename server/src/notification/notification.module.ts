import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assignment } from 'src/assignments/assignment.entity';
import { ClassroomAnnouncement } from 'src/classrooms/entities/classroom-announcement.entity';
import { Classroom } from 'src/classrooms/entities/classroom.entity';
import { ClassroomsModule } from 'src/classrooms/classrooms.module';
import { Doubts } from 'src/doubts/doubts.entity';
import { NotificationController } from './notification.controller';
import { Notification } from './notification.entity';
import { NotificationGateway } from './notification.gateway';
import { NotificationPreference } from './notification-preference.entity';
import { NotificationPushService } from './notification-push.service';
import { NotificationRepository } from './notification.repository';
import { NotificationService } from './notification.service';
import { PushSubscriptionEntity } from './push-subscription.entity';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      NotificationPreference,
      PushSubscriptionEntity,
      User,
      Classroom,
      ClassroomAnnouncement,
      Assignment,
      Doubts,
    ]),
    forwardRef(() => ClassroomsModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
    }),
  ],
  providers: [
    NotificationService,
    NotificationGateway,
    NotificationRepository,
    NotificationPushService,
  ],
  controllers: [NotificationController],
  exports: [NotificationService, NotificationGateway],
})
export class NotificationModule {}
