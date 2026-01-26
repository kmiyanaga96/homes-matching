import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
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

console.log("[Firebase] Initialized");
