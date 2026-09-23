import { io, Socket } from "socket.io-client";
import { NotificationItem } from "./api";
import { resolveBackendOrigin } from "@/lib/backend-url";

let notificationSocket: Socket | null = null;

function getNotificationNamespaceUrl() {
  return `${resolveBackendOrigin()}/notifications`;
}

export function connectNotificationSocket(token: string) {
  if (!notificationSocket) {
    notificationSocket = io(getNotificationNamespaceUrl(), {
      transports: ["websocket"],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });
  }

  notificationSocket.auth = { token };
  notificationSocket.connect();
  return notificationSocket;
}

export function disconnectNotificationSocket() {
  notificationSocket?.disconnect();
}

export function onNewNotification(listener: (notification: NotificationItem) => void) {
  notificationSocket?.on("notification:new", listener);
}

export function offNewNotification(listener?: (notification: NotificationItem) => void) {
  if (!notificationSocket) return;
  if (listener) {
    notificationSocket.off("notification:new", listener);
    return;
  }
  notificationSocket.off("notification:new");
}
