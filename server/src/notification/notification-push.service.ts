import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import { PushSubscriptionEntity } from './push-subscription.entity';
import { Notification } from './notification.entity';

@Injectable()
export class NotificationPushService {
  private readonly logger = new Logger(NotificationPushService.name);
  private readonly enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    const publicKey = this.configService.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.configService.get<string>('VAPID_PRIVATE_KEY');
    const subject =
      this.configService.get<string>('VAPID_SUBJECT') || 'mailto:admin@classroomhub.local';

    if (publicKey && privateKey) {
      webpush.setVapidDetails(subject, publicKey, privateKey);
      this.enabled = true;
    } else {
      this.enabled = false;
      this.logger.warn('Web push disabled: missing VAPID keys');
    }
  }

  getPublicKey() {
    return this.configService.get<string>('VAPID_PUBLIC_KEY') || null;
  }

  async sendToSubscriptions(
    subscriptions: PushSubscriptionEntity[],
    notification: Notification,
  ) {
    if (!this.enabled || !subscriptions.length) {
      return;
    }

    const payload = JSON.stringify({
      title: notification.title,
      body: notification.message,
      notificationId: notification.id,
      data: notification.data || {},
      createdAt: notification.createdAt,
    });

    await Promise.all(
      subscriptions.map(async (subscription) => {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.authKey,
          },
        };
        try {
          await webpush.sendNotification(pushSubscription, payload);
        } catch (error: any) {
          const statusCode = error?.statusCode;
          if (statusCode === 404 || statusCode === 410) {
            subscription.isActive = false;
          }
          this.logger.warn(`Push send failed: ${String(error?.message || error)}`);
        }
      }),
    );
  }
}
