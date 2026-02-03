/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAjUdT3q-vjgTqqmdV1QMk_IEF7blOIET4",
  authDomain: "homes-matching.firebaseapp.com",
  projectId: "homes-matching",
  storageBucket: "homes-matching.firebasestorage.app",
  messagingSenderId: "1023147657239",
  appId: "1:1023147657239:web:d1c071a783e9a61673f452",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message:', payload);
  const { title, body } = payload.notification || {};
  if (title) {
    self.registration.showNotification(title, {
      body: body || '',
      icon: '/homes-logo.png',
    });
  }
});
