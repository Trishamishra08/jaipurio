import { messaging, getToken, onMessage, deleteToken, isFirebaseConfigured, vapidKey } from '../firebase';
import api from '../utils/api';
import { isNativeApp } from '../utils/appContext';

/*
 * Web push for the three modules: customer ('user'), seller ('vendor'), admin ('admin').
 *
 * - One browser has ONE FCM token, but each role registers it separately with the
 *   backend (POST /notifications/devices with that role's login token), so signing
 *   out of one role never switches off another.
 * - Inside the native Jaipurio app the app registers its own token; this file hands
 *   the login over to it (window.JaipurioApp bridge) and does nothing else.
 * - Permission is never requested here at page load — call enablePush() from a button
 *   (see components/shared/PushPermissionPrompt.jsx). syncPush() only re-registers when
 *   the user has already said yes.
 */

export const ROLES = ['user', 'vendor', 'admin'];
const AUTH_KEYS = { user: ['customer_token'], vendor: ['vendor_token', 'vendor_auth'], admin: ['admin_token'] };
const flagKey = (role) => `jaipurio_push_${role}`; // value = the token registered for that role
const SYNC_EVERY_MS = 12 * 60 * 60 * 1000;
const lastSync = {};

const authToken = (role) => {
  for (const key of AUTH_KEYS[role]) {
    const v = localStorage.getItem(key);
    // vendor_auth is a 'true' flag in some flows, not a JWT
    if (v && v !== 'true' && v !== 'demo-vendor-token' && v.split('.').length === 3) return v;
  }
  return '';
};
const authHeaders = (role) => {
  const token = authToken(role);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/** Which role this URL belongs to (customer pages are 'user'). */
export const roleForPath = (pathname = window.location.pathname) =>
  pathname.startsWith('/admin') ? 'admin' : pathname.startsWith('/vendor') ? 'vendor' : 'user';

export const isPushSupported = () =>
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window &&
  isFirebaseConfigured &&
  Boolean(messaging) &&
  Boolean(vapidKey);

/**
 * 'in-app'      the native app handles push
 * 'unsupported' browser can't do web push, or Firebase isn't configured on this site
 * 'denied'      the user blocked notifications in the browser
 * 'enabled'     this role is registered on this device
 * 'ready'       permission granted but this role isn't registered yet
 * 'default'     not asked yet
 */
export const getPushState = (role) => {
  if (isNativeApp()) return 'in-app';
  if (!isPushSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  if (Notification.permission === 'granted') return localStorage.getItem(flagKey(role)) ? 'enabled' : 'ready';
  return 'default';
};

const registerWorker = async () => {
  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  await navigator.serviceWorker.ready;
  return registration;
};

const fetchToken = async () => {
  const serviceWorkerRegistration = await registerWorker();
  return getToken(messaging, { vapidKey, serviceWorkerRegistration });
};

const saveToBackend = async (role, token) => {
  await api.post('/notifications/devices', { token, platform: 'web', app: 'web' }, { headers: authHeaders(role) });
  localStorage.setItem(flagKey(role), token);
  lastSync[role] = Date.now();
};

/** Tell the native app wrapper who logged in (it registers its own FCM token). */
const nativeBridge = (action, role) => {
  try {
    const bridge = window.JaipurioApp;
    if (!bridge) return;
    if (action === 'register') bridge.registerPush?.(authToken(role), role);
    else bridge.unregisterPush?.(role);
  } catch {
    /* the app may not implement the bridge yet */
  }
};

/**
 * Ask permission (if needed) and register this browser for `role`.
 * Call from a click handler. Resolves to { ok, state, message }.
 */
export async function enablePush(role) {
  if (isNativeApp()) {
    nativeBridge('register', role);
    return { ok: true, state: 'in-app' };
  }
  if (!isPushSupported()) {
    return { ok: false, state: 'unsupported', message: 'Notifications are not available in this browser.' };
  }
  if (!authToken(role)) return { ok: false, state: getPushState(role), message: 'Please sign in first.' };
  try {
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        return { ok: false, state: getPushState(role), message: 'Notifications were not allowed.' };
      }
    }
    if (Notification.permission !== 'granted') {
      return { ok: false, state: 'denied', message: 'Notifications are blocked. Allow them in your browser settings.' };
    }
    const token = await fetchToken();
    if (!token) return { ok: false, state: 'ready', message: 'Could not get a notification token.' };
    await saveToBackend(role, token);
    return { ok: true, state: 'enabled' };
  } catch (error) {
    console.error('Push: could not enable notifications:', error);
    return { ok: false, state: getPushState(role), message: 'Could not turn on notifications. Please try again.' };
  }
}

/**
 * Silent refresh for a signed-in role: only when permission was already granted and
 * the role previously opted in (or was never asked but granted). Tokens rotate, so
 * this keeps the backend's copy fresh. Never shows a permission prompt.
 */
export async function syncPush(role, { force = false } = {}) {
  if (isNativeApp()) {
    if (authToken(role)) nativeBridge('register', role);
    return;
  }
  if (!isPushSupported() || Notification.permission !== 'granted' || !authToken(role)) return;
  if (!localStorage.getItem(flagKey(role))) return; // user hasn't turned it on for this role
  if (!force && lastSync[role] && Date.now() - lastSync[role] < SYNC_EVERY_MS) return;
  lastSync[role] = Date.now();
  try {
    const token = await fetchToken();
    if (token) await saveToBackend(role, token);
  } catch (error) {
    console.warn('Push: silent sync failed:', error.message);
  }
}

/**
 * Remove this browser from `role` (call on logout BEFORE the login token is cleared).
 * The browser token itself is deleted only when no other role still uses it.
 */
export async function disablePush(role) {
  if (isNativeApp()) {
    nativeBridge('unregister', role);
    return;
  }
  const token = localStorage.getItem(flagKey(role));
  localStorage.removeItem(flagKey(role));
  if (!token) return;
  const headers = authHeaders(role); // captured now, before the caller wipes localStorage
  try {
    await api.delete('/notifications/devices', { data: { token }, headers });
  } catch (error) {
    console.warn('Push: could not remove device on the server:', error.message);
  }
  const stillUsed = ROLES.some((r) => r !== role && localStorage.getItem(flagKey(r)) === token);
  if (!stillUsed && messaging) {
    try {
      await deleteToken(messaging);
    } catch {
      /* already gone */
    }
  }
}

let unsubscribeForeground = null;

/**
 * Foreground messages (page open): re-broadcast as a window event so bells, inboxes and the
 * toast refresh live. The OS notification is not shown while the tab is focused.
 */
export function listenForeground() {
  if (unsubscribeForeground || !messaging || isNativeApp()) return () => {};
  try {
    unsubscribeForeground = onMessage(messaging, (payload) => {
      const data = payload.data || {};
      window.dispatchEvent(
        new CustomEvent('jaipurio:notification', {
          detail: {
            title: payload.notification?.title || data.title || 'Jaipurio',
            body: payload.notification?.body || data.body || '',
            link: data.link || '/',
            role: data.role || '',
            category: data.category || '',
            id: data.notificationId || '',
          },
        })
      );
    });
  } catch (error) {
    console.warn('Push: foreground listener failed:', error.message);
  }
  return () => {
    unsubscribeForeground?.();
    unsubscribeForeground = null;
  };
}

/** Browser/server status for settings screens. */
export const getDeviceCount = async (role) => {
  const res = await api.get('/notifications/preferences', { headers: authHeaders(role) });
  return res.data?.data || {};
};

export { authToken as getRoleAuthToken };
