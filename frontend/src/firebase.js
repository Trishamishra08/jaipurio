import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getDatabase } from 'firebase/database';

/*
 * Sada Bharat Firebase config (DISABLED — replace with Jaipurio project later)
 * apiKey: "AIzaSyBCbd4bNuYJ3XXdZleyBzlMIA-M1YIsXFc",
 * authDomain: "sadabharat-65670.firebaseapp.com",
 * projectId: "sadabharat-65670",
 * storageBucket: "sadabharat-65670.firebasestorage.app",
 * messagingSenderId: "751373581927",
 * appId: "1:751373581927:web:b8c1f7b3765d5d1a355ec2",
 * measurementId: "G-NSDT53M6Q9",
 * databaseURL: "https://sadabharat-65670-default-rtdb.asia-southeast1.firebasedatabase.app"
 */

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || '',
};

const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let app = null;
let messaging = null;
let db = null;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
    db = getDatabase(app);
  } catch (err) {
    console.warn('Firebase init skipped:', err.message);
  }
} else {
  console.info('Firebase disabled — add Jaipurio VITE_FIREBASE_* env vars when ready.');
}

export { messaging, getToken, onMessage, db, isFirebaseConfigured };
