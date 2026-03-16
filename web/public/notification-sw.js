self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (_e) {
    payload = {};
  }

  const title = payload.title || "New Notification";
  const options = {
    body: payload.body || "",
    data: payload.data || {},
    tag: payload.notificationId || undefined,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const route = event.notification.data?.route || "/dashboard";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client && "navigate" in client) {
          return client.navigate(route).then(() => client.focus());
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(route);
      }
      return undefined;
    }),
  );
});
