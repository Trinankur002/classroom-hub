import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { NotificationService } from './notification.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  getForCurrentUser(
    @Request() req,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.notificationService.getNotificationsForUser(req.user.id, {
      page,
      limit,
    });
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    const count = await this.notificationService.getUnreadCount(req.user.id);
    return { unreadCount: count };
  }

  @Patch(':id/read')
  async markAsRead(@Request() req, @Param('id', new ParseUUIDPipe()) id: string) {
    await this.notificationService.markAsRead(id, req.user.id);
    return { success: true };
  }

  @Patch('read-all')
  async markAllRead(@Request() req) {
    await this.notificationService.markAllAsRead(req.user.id);
    return { success: true };
  }

  @Delete(':id')
  async deleteOne(@Request() req, @Param('id', new ParseUUIDPipe()) id: string) {
    await this.notificationService.deleteNotification(id, req.user.id);
    return { success: true };
  }

  @Get('preferences')
  getPreferences(@Request() req) {
    return this.notificationService.getPreferences(req.user.id);
  }

  @Patch('preferences')
  updatePreferences(
    @Request() req,
    @Body()
    body: Partial<{
      email: boolean;
      push: boolean;
      messages: boolean;
      assignments: boolean;
      grades: boolean;
    }>,
  ) {
    return this.notificationService.updatePreferences(req.user.id, body);
  }

  @Get('push/status')
  getPushStatus(@Request() req) {
    return this.notificationService.getPushStatus(req.user.id);
  }

  @Post('push/subscribe')
  subscribePush(
    @Request() req,
    @Body()
    body: {
      endpoint: string;
      keys: { p256dh: string; auth: string };
      userAgent?: string;
    },
  ) {
    return this.notificationService.subscribePush(req.user.id, body);
  }

  @Delete('push/unsubscribe')
  unsubscribePush(
    @Request() req,
    @Body() body?: { endpoint?: string },
  ) {
    return this.notificationService.unsubscribePush(req.user.id, body?.endpoint);
  }
}
