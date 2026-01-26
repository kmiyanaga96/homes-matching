/* =========================
   Firebase Configuration
   ========================= */

const firebaseConfig = {
  apiKey: "AIzaSyAjUdT3q-vjgTqqmdV1QMk_IEF7blOIET4",
  authDomain: "homes-matching.firebaseapp.com",
  projectId: "homes-matching",
  storageBucket: "homes-matching.firebasestorage.app",
  messagingSenderId: "1023147657239",
  appId: "1:1023147657239:web:d1c071a783e9a61673f452",
  measurementId: "G-M5HZLJBEY6"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Firestore instance
const db = firebase.firestore();

// Collections
const COLLECTIONS = {
  members: "members",
  notices: "notices"
};

console.log("[Firebase] Initialized");
