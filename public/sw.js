self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};

  const options = {
    body: data.body || 'New deal alert!',
    icon: '/icon-192.png',
    badge: '/badge.png',
    vibrate: [200, 100, 200],
    data: data.url || '/',
    actions: data.actions || [],
    tag: data.tag || 'shinnslist-deal',
    requireInteraction: data.requireInteraction || false,
    timestamp: Date.now(),
  };

  event.waitUntil(self.registration.showNotification(data.title || 'Shinnslist Deal', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a tab is already open, focus it
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Install immediately
self.addEventListener('install', () => {
  self.skipWaiting();
});

// Control all pages
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
