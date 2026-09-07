// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

/*
 * Sada Bharat Firebase config (DISABLED — replace with Jaipurio project later)
 * const firebaseConfig = {
 *   apiKey: "AIzaSyBCbd4bNuYJ3XXdZleyBzlMIA-M1YIsXFc",
 *   authDomain: "sadabharat-65670.firebaseapp.com",
 *   projectId: "sadabharat-65670",
 *   storageBucket: "sadabharat-65670.firebasestorage.app",
 *   messagingSenderId: "751373581927",
 *   appId: "1:751373581927:web:b8c1f7b3765d5d1a355ec2",
 *   measurementId: "G-NSDT53M6Q9"
 * };
 */

// Jaipurio Firebase placeholders — fill when project is created
const firebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
  measurementId: ''
};

if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message', payload);

    const notificationTitle = payload.notification ? payload.notification.title : (payload.data?.title || 'New Notification');
    const notificationOptions = {
      body: payload.notification ? payload.notification.body : (payload.data?.body || 'You have a new message.'),
      icon: payload.notification ? payload.notification.icon : (payload.data?.icon || '/logo.png'),
      data: payload.data || {}
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} else {
  console.info('[firebase-messaging-sw.js] Firebase disabled until Jaipurio config is added.');
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data;
  const urlToOpen = data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
      return undefined;
    })
  );
});
