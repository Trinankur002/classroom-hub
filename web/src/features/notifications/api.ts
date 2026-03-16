import api from "@/services/api";

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  entityId: string | null;
  entityType: string | null;
  data: {
    route?: string;
    classroomId?: string;
    classroomName?: string;
    actorId?: string;
    actorName?: string;
    entityId?: string;
    entityType?: string;
    entityTitle?: string;
    context?: Record<string, any>;
  } | null;
  priority: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  total: number;
  page: number;
  limit: number;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  messages: boolean;
  assignments: boolean;
  grades: boolean;
}

export const notificationsApi = {
  async getNotifications(page = 1, limit = 20): Promise<NotificationListResponse> {
    const response = await api.get(`/notifications?page=${page}&limit=${limit}`);
    return response.data;
  },

  async getUnreadCount(): Promise<number> {
    const response = await api.get(`/notifications/unread-count`);
    return response.data.unreadCount ?? 0;
  },

  async markRead(id: string): Promise<void> {
    await api.patch(`/notifications/${id}/read`);
  },

  async markAllRead(): Promise<void> {
    await api.patch(`/notifications/read-all`);
  },

  async deleteOne(id: string): Promise<void> {
    await api.delete(`/notifications/${id}`);
  },

  async getPreferences(): Promise<NotificationPreferences> {
    const response = await api.get(`/notifications/preferences`);
    return response.data;
  },

  async updatePreferences(
    payload: Partial<NotificationPreferences>,
  ): Promise<NotificationPreferences> {
    const response = await api.patch(`/notifications/preferences`, payload);
    return response.data;
  },

  async getPushStatus(): Promise<{
    pushEnabled: boolean;
    hasSubscription: boolean;
    vapidPublicKey: string | null;
  }> {
    const response = await api.get(`/notifications/push/status`);
    return response.data;
  },

  async subscribePush(payload: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
    userAgent?: string;
  }): Promise<void> {
    await api.post(`/notifications/push/subscribe`, payload);
  },

  async unsubscribePush(endpoint?: string): Promise<void> {
    await api.delete(`/notifications/push/unsubscribe`, {
      data: endpoint ? { endpoint } : {},
    });
  },
};
