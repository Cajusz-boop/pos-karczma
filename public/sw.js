const CACHE_NAME = "pos-karczma-v1";
const STATIC_ASSETS = ["/", "/pos", "/login"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ─── Push Notifications ─────────────────────────────────────────────

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "POS Karczma", body: event.data.text() };
  }

  const options = {
    body: payload.body ?? "",
    icon: payload.icon ?? "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [200, 100, 200],
    tag: payload.data?.type ?? "default",
    renotify: true,
    data: payload.data ?? {},
    actions: [],
  };

  // Add actions based on notification type
  if (payload.data?.type === "ORDER_READY") {
    options.actions = [
      { action: "open", title: "Otwórz zamówienie" },
      { action: "dismiss", title: "OK" },
    ];
  }

  event.waitUntil(
    self.registration.showNotification(payload.title ?? "POS Karczma", options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification.data ?? {};

  if (event.action === "dismiss") return;

  // Navigate to the relevant page
  let url = "/pos";
  if (data.orderId) {
    url = `/pos/order/${data.orderId}`;
  }

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      // Focus existing window if available
      for (const client of clients) {
        if (client.url.includes("/pos") && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Open new window
      return self.clients.openWindow(url);
    })
  );
});

// ─── Fetch (Caching) ────────────────────────────────────────────────

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;

  // API requests: network-first with offline queue
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});
