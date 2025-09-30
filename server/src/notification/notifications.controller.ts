// src/notification/notifications.controller.ts
import { Controller, Get, Patch, Req, Param, Query } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationService: NotificationService) { }

    @Get()
    async list(@Req() req, @Query('limit') limitStr?: string, @Query('offset') offsetStr?: string) {
        const limit = +(limitStr || 20);
        const offset = +(offsetStr || 0);
        return this.notificationService.listForUser(req.user.id, limit, offset);
    }

    @Patch(':id/read')
    async markRead(@Req() req, @Param('id') id: string) {
        await this.notificationService.markAsRead(id, req.user.id);
        return { ok: true };
    }

    @Patch('read-all')
    async markAll(@Req() req) {
        await this.notificationService.markAllRead(req.user.id);
        return { ok: true };
    }
}
