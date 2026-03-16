import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsApi, NotificationItem } from "./api";
import {
  connectNotificationSocket,
  disconnectNotificationSocket,
  offNewNotification,
  onNewNotification,
} from "./socket";
import { disableBrowserPush, enableBrowserPush } from "./push";

const NOTIFICATIONS_QUERY_KEY = ["notifications", "list"];
const UNREAD_COUNT_QUERY_KEY = ["notifications", "unread-count"];

export function useNotifications() {
  const queryClient = useQueryClient();
  const token = localStorage.getItem("token") || "";
  const [pushPermission, setPushPermission] = useState<NotificationPermission | "unsupported">(
    typeof Notification === "undefined" ? "unsupported" : Notification.permission,
  );
  const [isEnablingPush, setIsEnablingPush] = useState(false);
  const [pushHint, setPushHint] = useState<string | null>(null);

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

  useEffect(() => {
    if (!token) return;
    if (typeof Notification === "undefined") {
      setPushPermission("unsupported");
      return;
    }

    const syncPermission = async () => {
      const permission = Notification.permission;
      setPushPermission(permission);

      try {
        const preferences = await notificationsApi.getPreferences();
        if (permission !== "granted" && preferences.push) {
          await notificationsApi.updatePreferences({ push: false });
          await disableBrowserPush();
          setPushHint("Browser permission is off, so push was turned off in your preferences.");
        }
      } catch (error) {
        console.error("Failed syncing notification permission with preferences", error);
      }
    };

    void syncPermission();
  }, [token]);

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

  const enablePush = async () => {
    if (typeof Notification === "undefined") {
      setPushPermission("unsupported");
      setPushHint("Your browser does not support push notifications.");
      return;
    }

    setIsEnablingPush(true);
    try {
      const result = await enableBrowserPush();
      const permission = Notification.permission;
      setPushPermission(permission);

      if (!result.enabled) {
        await notificationsApi.updatePreferences({ push: false });
        setPushHint(result.reason || "Push notification permission is not enabled.");
        return;
      }

      await notificationsApi.updatePreferences({ push: true });
      setPushHint(null);
    } catch (error: any) {
      console.error("Failed to enable push notifications", error);
      await notificationsApi.updatePreferences({ push: false });
      setPushHint(error?.message || "Failed to enable push notifications.");
    } finally {
      setIsEnablingPush(false);
    }
  };

  return {
    notifications: notificationsQuery.data?.items ?? [],
    unreadCount: unreadCountQuery.data ?? 0,
    isLoading: notificationsQuery.isLoading || unreadCountQuery.isLoading,
    markRead: markReadMutation.mutateAsync,
    markAllRead: markAllReadMutation.mutateAsync,
    deleteNotification: deleteMutation.mutateAsync,
    refetch: notificationsQuery.refetch,
    pushPermission,
    pushHint,
    isEnablingPush,
    enablePush,
  };
}
