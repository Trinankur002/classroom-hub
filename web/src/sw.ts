/// <reference lib="webworker" />

import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { CacheFirst, NetworkFirst, NetworkOnly } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { CacheableResponsePlugin } from "workbox-cacheable-response";

declare let self: ServiceWorkerGlobalScope;

// ✅ precache (important)
precacheAndRoute(self.__WB_MANIFEST);

// -----------------------------
// Do not cache sensitive / real-time endpoints.
registerRoute(
  ({ url, request }) => {
    if (request.method !== "GET") return false;
    const pathname = url.pathname.toLowerCase();
    return (
      pathname.includes("/auth") ||
      pathname.includes("/chat") ||
      pathname.includes("/live") ||
      pathname.includes("/ws") ||
      pathname.includes("socket")
    );
  },
  new NetworkOnly()
);

// ✅ API caching (GET only): classrooms, announcements, assignments
// -----------------------------
registerRoute(
  ({ url, request }) => {
    if (request.method !== "GET") return false;
    const pathname = url.pathname.toLowerCase();
    return (
      /\/(api\/)?classrooms(\/|$)/.test(pathname) ||
      /\/(api\/)?assignments(\/|$)/.test(pathname) ||
      pathname.includes("/announcements") ||
      pathname.includes("/announcement/")
    );
  },
  new NetworkFirst({
    cacheName: "classroom-hub-api-v1",
    networkTimeoutSeconds: 6,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 40,
        maxAgeSeconds: 60 * 60 * 24,
      }),
    ],
  })
);

// -----------------------------
// ✅ Static assets
// -----------------------------
registerRoute(
  ({ request }) => request.method === "GET" && request.destination === "image",
  new CacheFirst({
    cacheName: "classroom-hub-images-v1",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24,
      }),
    ],
  })
);

registerRoute(
  ({ request }) =>
    request.method === "GET" &&
    (request.destination === "style" ||
      request.destination === "script" ||
      request.destination === "worker" ||
      request.destination === "font"),
  new CacheFirst({
    cacheName: "classroom-hub-static-v1",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 60 * 60 * 24,
      }),
    ],
  })
);

// -----------------------------
// 🔔 Your notification logic
// -----------------------------
self.addEventListener("push", (event) => {
    const data = event.data?.json() || {};

    event.waitUntil(
        self.registration.showNotification(data.title || "Notification", {
            body: data.body,
            icon: "/pwa-192.png",
        })
    );
});
