import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ClassroomsModule } from './classrooms/classrooms.module';
import { UsersModule } from './users/users.module';
import { ChatModule } from './chat/chat.module';
import { FileModule } from './fileServices/file.module';
import { AssignmentModule } from './assignments/assignment.module';
import { DoubtsModule } from './doubts/doubts.module';
import { EventsModule } from './event/event.module';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),
    AuthModule,
    UsersModule,
    ClassroomsModule,
    ChatModule,
    FileModule,
    AssignmentModule,
    DoubtsModule,
    EventsModule,
    // NotificationModule
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
