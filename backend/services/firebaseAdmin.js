const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');

/*
 * Firebase Admin (server side of push notifications).
 *
 * Credentials, in order of preference:
 *   FIREBASE_SERVICE_ACCOUNT  — the service-account JSON, raw or base64-encoded
 *   FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY (+ optional ids)
 * With neither set, push is disabled: every send is a no-op and the in-app
 * notification inbox keeps working.
 */

const FCM_BATCH = 500; // sendEachForMulticast limit

const parseServiceAccount = () => {
  const raw = (process.env.FIREBASE_SERVICE_ACCOUNT || '').trim();
  if (raw) {
    try {
      const json = raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
      const sa = JSON.parse(json);
      if (sa.private_key) sa.private_key = sa.private_key.replace(/\\n/g, '\n');
      return sa;
    } catch (err) {
      console.error('FCM: FIREBASE_SERVICE_ACCOUNT is not valid JSON/base64 JSON:', err.message);
      return null;
    }
  }
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    return {
      type: 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      token_uri: 'https://oauth2.googleapis.com/token',
    };
  }
  return null;
};

let firebaseApp = null;
let initTried = false; // log the "not configured" / failure message only once
const init = () => {
  if (firebaseApp) return firebaseApp;
  if (process.env.PUSH_ENABLED === 'false' || initTried) return null;
  initTried = true;
  if (getApps().length) {
    firebaseApp = getApps()[0];
    return firebaseApp;
  }
  const sa = parseServiceAccount();
  if (!sa) {
    console.info('FCM: Firebase credentials not set — push notifications disabled (in-app inbox still works).');
    return null;
  }
  try {
    firebaseApp = initializeApp({ credential: cert(sa) });
    console.log('FCM: Firebase Admin initialized.');
  } catch (err) {
    console.error('FCM: Firebase Admin initialization failed:', err.message);
    firebaseApp = null;
  }
  return firebaseApp;
};
init();

const isPushEnabled = () => Boolean(init());

const siteUrl = () => (process.env.SITE_URL || 'https://jaipurio.in').replace(/\/+$/, '');
const absolute = (link) => (!link ? siteUrl() : /^https?:\/\//i.test(link) ? link : `${siteUrl()}${link.startsWith('/') ? '' : '/'}${link}`);
const stringData = (data = {}) =>
  Object.fromEntries(
    Object.entries(data)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)])
  );

const ANDROID_CHANNEL = {
  order: 'orders', payment: 'orders', return: 'orders', stock: 'orders', product: 'orders',
  payout: 'payouts', affiliate: 'payouts',
  chat: 'chat', support: 'chat',
  promotion: 'promotions',
};

/**
 * Builds the platform-specific parts of an FCM message.
 * @param {{ title, body, link, image, category, tag, data }} p
 */
const buildMessage = (p) => {
  const link = p.link || '/';
  const data = stringData({ ...(p.data || {}), link, category: p.category || 'general' });
  const transactional = p.category !== 'promotion';
  return {
    notification: { title: p.title, body: p.body, ...(p.image ? { imageUrl: absolute(p.image) } : {}) },
    data,
    webpush: {
      notification: {
        icon: '/jaipurio_logo.png',
        badge: '/favicon.png',
        ...(p.tag ? { tag: p.tag, renotify: true } : {}),
      },
      fcmOptions: { link: absolute(link) },
    },
    android: {
      priority: transactional ? 'high' : 'normal',
      notification: {
        channelId: ANDROID_CHANNEL[p.category] || 'general',
        ...(p.tag ? { tag: p.tag } : {}),
        clickAction: 'OPEN_LINK',
      },
    },
    apns: { payload: { aps: { sound: 'default' } } },
  };
};

// Errors meaning the token will never work again — delete it.
const DEAD_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
]);

/**
 * Sends one message to many tokens.
 * @returns {{ successCount, failureCount, deadTokens: string[] }}
 */
async function sendToTokens(tokens, payload) {
  const list = [...new Set((tokens || []).filter(Boolean))];
  const result = { successCount: 0, failureCount: 0, deadTokens: [], skipped: false };
  if (!list.length) return result;
  const app = init();
  if (!app) return { ...result, skipped: true };

  const messaging = getMessaging(app);
  const base = buildMessage(payload);
  for (let i = 0; i < list.length; i += FCM_BATCH) {
    const chunk = list.slice(i, i + FCM_BATCH);
    try {
      const res = await messaging.sendEachForMulticast({ ...base, tokens: chunk });
      result.successCount += res.successCount;
      result.failureCount += res.failureCount;
      res.responses.forEach((r, idx) => {
        if (!r.success && DEAD_TOKEN_CODES.has(r.error?.code)) result.deadTokens.push(chunk[idx]);
      });
    } catch (err) {
      result.failureCount += chunk.length;
      console.error('FCM: multicast failed:', err.message);
    }
  }
  return result;
}

async function sendToTopic(topic, payload) {
  const app = init();
  if (!app) return { skipped: true };
  try {
    const id = await getMessaging(app).send({ ...buildMessage(payload), topic });
    return { messageId: id };
  } catch (err) {
    console.error(`FCM: topic send to "${topic}" failed:`, err.message);
    return { error: err.message };
  }
}

async function subscribeToTopic(tokens, topic) {
  const app = init();
  const list = (tokens || []).filter(Boolean);
  if (!app || !list.length) return null;
  try {
    return await getMessaging(app).subscribeToTopic(list, topic);
  } catch (err) {
    console.error(`FCM: subscribe to "${topic}" failed:`, err.message);
    return null;
  }
}

async function unsubscribeFromTopic(tokens, topic) {
  const app = init();
  const list = (tokens || []).filter(Boolean);
  if (!app || !list.length) return null;
  try {
    return await getMessaging(app).unsubscribeFromTopic(list, topic);
  } catch (err) {
    console.error(`FCM: unsubscribe from "${topic}" failed:`, err.message);
    return null;
  }
}

/** Legacy signature kept for old callers: sendPushNotification(tokens, { title, body, data }). */
async function sendPushNotification(tokens, payload) {
  return sendToTokens(tokens, { title: payload.title, body: payload.body, data: payload.data, link: payload.data?.link });
}

module.exports = {
  isPushEnabled,
  buildMessage,
  sendToTokens,
  sendToTopic,
  subscribeToTopic,
  unsubscribeFromTopic,
  sendPushNotification,
};
