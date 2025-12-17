importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Config from firebase.ts
const firebaseConfig = {
  apiKey: "AIzaSyCSs8dyTW_5FNllDtODiPuVuqScXbweDl4",
  authDomain: "close-box-17904.firebaseapp.com",
  projectId: "close-box-17904",
  storageBucket: "close-box-17904.firebasestorage.app",
  messagingSenderId: "353620096626",
  appId: "1:353620096626:web:2ac80029d6feb775ae34eb",
  measurementId: "G-CZS08SWWE6"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// PWA lifecycle: Install
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// PWA lifecycle: Activate
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// PWA: Basic fetch handler to satisfy installability criteria
self.addEventListener('fetch', (event) => {
  // Can be used for offline caching in the future
});

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'New Question!';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new anonymous message.',
    icon: 'data:image/svg+xml,%3Csvg width="192" height="192" viewBox="0 0 192 192" fill="none" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="192" height="192" rx="48" fill="url(%23grad)" /%3E%3Cdefs%3E%3ClinearGradient id="grad" x1="0" y1="0" x2="192" y2="192" gradientUnits="userSpaceOnUse"%3E%3Cstop stop-color="%23db2777" /%3E%3Cstop offset="1" stop-color="%23f97316" /%3E%3C/linearGradient%3E%3C/defs%3E%3Ctext x="50%25" y="50%25" dominant-baseline="central" text-anchor="middle" fill="white" font-family="sans-serif" font-weight="900" font-size="110"%3EA%3C/text%3E%3C/svg%3E',
    data: {
      url: '/#/inbox'
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(windowClients => {
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url.indexOf('/inbox') !== -1 && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/#/inbox');
      }
    })
  );
});
