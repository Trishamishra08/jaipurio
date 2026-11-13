import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, deleteToken } from 'firebase/messaging';
import { getDatabase } from 'firebase/database';

/*
 * Firebase is optional for Jaipurio. Configure via VITE_FIREBASE_* env vars when ready.
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

// Web Push certificate key pair (Firebase console → Cloud Messaging → Web configuration).
const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';

let app = null;
let messaging = null;
let db = null;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    // Messaging needs service workers + Push API; it throws on unsupported browsers (e.g. iOS Safari outside a Home Screen app).
    try {
      messaging = getMessaging(app);
    } catch (err) {
      console.info('Push messaging unavailable in this browser:', err.message);
    }
  } catch (err) {
    console.warn('Firebase init skipped:', err.message);
  }
} else {
  console.info('Firebase disabled — add Jaipurio VITE_FIREBASE_* env vars when ready.');
}

export { messaging, getToken, onMessage, deleteToken, db, isFirebaseConfigured, vapidKey, firebaseConfig };
