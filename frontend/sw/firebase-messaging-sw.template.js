/* eslint-disable no-undef */
// Jaipurio push-notification service worker.
// Generated at build time (vite.config.js → firebaseMessagingSw) so the public Firebase
// web config comes from the VITE_FIREBASE_* environment variables — nothing is hard-coded.
importScripts('https://www.gstatic.com/firebasejs/__FIREBASE_VERSION__/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/__FIREBASE_VERSION__/firebase-messaging-compat.js');

const firebaseConfig = __FIREBASE_CONFIG__;

if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  // Messages we send always carry a `notification` block, which the browser shows by itself
  // (and which opens `webpush.fcmOptions.link` when clicked). This handler only covers
  // data-only messages, so nothing is ever shown twice.
  messaging.onBackgroundMessage((payload) => {
    if (payload.notification) return;
    const data = payload.data || {};
    if (!data.title) return;
    self.registration.showNotification(data.title, {
      body: data.body || '',
      icon: '/jaipurio_logo.png',
      badge: '/favicon.png',
      tag: data.tag || undefined,
      data: { own: true, link: data.link || '/' },
    });
  });
}

// Click on a notification this worker showed itself: focus an open tab or open the link.
self.addEventListener('notificationclick', (event) => {
  const own = event.notification.data && event.notification.data.own;
  if (!own) return; // Firebase handles the notifications it displayed
  event.notification.close();
  const url = new URL(event.notification.data.link || '/', self.location.origin).href;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
