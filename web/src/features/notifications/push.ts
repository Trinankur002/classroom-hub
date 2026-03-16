import { notificationsApi } from "./api";

const SW_PATH = "/notification-sw.js";

function toBase64Url(buffer: ArrayBuffer | null) {
  if (!buffer) return "";
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerNotificationServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;
  return navigator.serviceWorker.register(SW_PATH);
}

export async function enableBrowserPush(): Promise<{
  enabled: boolean;
  reason?: string;
}> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { enabled: false, reason: "Push not supported in this browser." };
  }

  const registration = await registerNotificationServiceWorker();
  if (!registration) {
    return { enabled: false, reason: "Service worker registration failed." };
  }

  let permission = Notification.permission;
  if (permission !== "granted") {
    permission = await Notification.requestPermission();
  }

  if (permission !== "granted") {
    return { enabled: false, reason: "Notification permission was denied." };
  }

  const pushStatus = await notificationsApi.getPushStatus();
  if (!pushStatus.vapidPublicKey) {
    return { enabled: false, reason: "Missing VAPID public key." };
  }

  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ||
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(pushStatus.vapidPublicKey),
    }));

  await notificationsApi.subscribePush({
    endpoint: subscription.endpoint,
    keys: {
      p256dh: toBase64Url(subscription.getKey("p256dh")),
      auth: toBase64Url(subscription.getKey("auth")),
    },
    userAgent: navigator.userAgent,
  });

  return { enabled: true };
}

export async function disableBrowserPush(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration(SW_PATH);
  const subscription = await registration?.pushManager.getSubscription();
  if (subscription) {
    await notificationsApi.unsubscribePush(subscription.endpoint);
    await subscription.unsubscribe();
    return;
  }
  await notificationsApi.unsubscribePush();
}
