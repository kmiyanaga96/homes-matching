import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

export const firebaseConfig = {
  apiKey: "AIzaSyAjUdT3q-vjgTqqmdV1QMk_IEF7blOIET4",
  authDomain: "homes-matching.firebaseapp.com",
  projectId: "homes-matching",
  storageBucket: "homes-matching.firebasestorage.app",
  messagingSenderId: "1023147657239",
  appId: "1:1023147657239:web:d1c071a783e9a61673f452",
  measurementId: "G-M5HZLJBEY6"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// FCM - lazy init (only when supported)
let messagingInstance = null;

export async function getMessagingInstance() {
  if (messagingInstance) return messagingInstance;
  const supported = await isSupported();
  if (!supported) {
    console.warn("[FCM] Not supported in this browser");
    return null;
  }
  messagingInstance = getMessaging(app);
  return messagingInstance;
}

export async function requestFCMToken() {
  try {
    const messaging = await getMessagingInstance();
    if (!messaging) return null;
    const token = await getToken(messaging, {
      vapidKey: '' // VAPID key を本番環境で設定する
    });
    return token;
  } catch (e) {
    console.error("[FCM] getToken error:", e);
    return null;
  }
}

export async function onForegroundMessage(callback) {
  const messaging = await getMessagingInstance();
  if (!messaging) return () => {};
  return onMessage(messaging, callback);
}

console.log("[Firebase] Initialized");
