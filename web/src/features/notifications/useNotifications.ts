import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsApi, NotificationItem } from "./api";
import {
  connectNotificationSocket,
  disconnectNotificationSocket,
  offNewNotification,
  onNewNotification,
} from "./socket";

const NOTIFICATIONS_QUERY_KEY = ["notifications", "list"];
const UNREAD_COUNT_QUERY_KEY = ["notifications", "unread-count"];

export function useNotifications() {
  const queryClient = useQueryClient();
  const token = localStorage.getItem("token") || "";

  const notificationsQuery = useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: () => notificationsApi.getNotifications(1, 20),
  });

  const unreadCountQuery = useQuery({
    queryKey: UNREAD_COUNT_QUERY_KEY,
    queryFn: () => notificationsApi.getUnreadCount(),
  });

  useEffect(() => {
    if (!token) return;

    connectNotificationSocket(token);
    const listener = (notification: NotificationItem) => {
      queryClient.setQueryData(
        NOTIFICATIONS_QUERY_KEY,
        (current: any | undefined) => {
          if (!current) {
            return {
              items: [notification],
              total: 1,
              page: 1,
              limit: 20,
            };
          }

          const exists = current.items.some((item: NotificationItem) => item.id === notification.id);
          if (exists) return current;

          return {
            ...current,
            items: [notification, ...current.items].slice(0, current.limit ?? 20),
            total: (current.total ?? 0) + 1,
          };
        },
      );

      queryClient.setQueryData(
        UNREAD_COUNT_QUERY_KEY,
        (count: number | undefined) => (count ?? 0) + 1,
      );
    };

    onNewNotification(listener);

    return () => {
      offNewNotification(listener);
      disconnectNotificationSocket();
    };
  }, [queryClient, token]);

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, (current: any | undefined) => {
        if (!current) return current;
        return {
          ...current,
          items: current.items.map((item: NotificationItem) =>
            item.id === id ? { ...item, isRead: true } : item,
          ),
        };
      });

      queryClient.setQueryData(UNREAD_COUNT_QUERY_KEY, (count: number | undefined) =>
        Math.max((count ?? 0) - 1, 0),
      );
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, (current: any | undefined) => {
        if (!current) return current;
        return {
          ...current,
          items: current.items.map((item: NotificationItem) => ({ ...item, isRead: true })),
        };
      });
      queryClient.setQueryData(UNREAD_COUNT_QUERY_KEY, 0);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.deleteOne(id),
    onSuccess: (_, id) => {
      const currentList: any = queryClient.getQueryData(NOTIFICATIONS_QUERY_KEY);
      const removed = currentList?.items?.find((item: NotificationItem) => item.id === id);

      queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, (current: any | undefined) => {
        if (!current) return current;
        return {
          ...current,
          items: current.items.filter((item: NotificationItem) => item.id !== id),
          total: Math.max((current.total ?? 1) - 1, 0),
        };
      });

      if (removed && !removed.isRead) {
        queryClient.setQueryData(UNREAD_COUNT_QUERY_KEY, (count: number | undefined) =>
          Math.max((count ?? 0) - 1, 0),
        );
      }
    },
  });

  return {
    notifications: notificationsQuery.data?.items ?? [],
    unreadCount: unreadCountQuery.data ?? 0,
    isLoading: notificationsQuery.isLoading || unreadCountQuery.isLoading,
    markRead: markReadMutation.mutateAsync,
    markAllRead: markAllReadMutation.mutateAsync,
    deleteNotification: deleteMutation.mutateAsync,
    refetch: notificationsQuery.refetch,
  };
}
