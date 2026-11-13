// Each test file runs in its own process, so env set here only affects this file.
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const { privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  publicKeyEncoding: { type: 'spki', format: 'pem' },
});

const serviceAccount = {
  type: 'service_account',
  project_id: 'jaipurio-test',
  private_key_id: 'abc123',
  private_key: privateKey,
  client_email: 'firebase-adminsdk@jaipurio-test.iam.gserviceaccount.com',
  client_id: '1',
  token_uri: 'https://oauth2.googleapis.com/token',
};

test('push stays disabled (and sends are no-ops) when no credentials are set', async () => {
  for (const k of ['FIREBASE_SERVICE_ACCOUNT', 'FIREBASE_PROJECT_ID', 'FIREBASE_PRIVATE_KEY', 'FIREBASE_CLIENT_EMAIL']) delete process.env[k];
  const fb = require('../services/firebaseAdmin');
  assert.equal(fb.isPushEnabled(), false);
  const result = await fb.sendToTokens(['tok'], { title: 't', body: 'b' });
  assert.equal(result.skipped, true);
  assert.equal(result.successCount, 0);
});

test('buildMessage: link, collapse tag, android channel and string-only data', () => {
  const { buildMessage } = require('../services/firebaseAdmin');
  const m = buildMessage({
    title: 'Order shipped',
    body: 'On its way',
    link: '/orders',
    category: 'order',
    tag: 'order-JP-1',
    data: { orderId: 42, nested: { a: 1 }, skip: undefined, nothing: null },
  });
  assert.equal(m.notification.title, 'Order shipped');
  assert.match(m.webpush.fcmOptions.link, /^https?:\/\/.+\/orders$/);
  assert.equal(m.webpush.notification.tag, 'order-JP-1');
  assert.equal(m.android.notification.channelId, 'orders');
  assert.equal(m.android.priority, 'high');
  assert.equal(m.data.link, '/orders');
  for (const [k, v] of Object.entries(m.data)) assert.equal(typeof v, 'string', `data.${k} must be a string`);
  assert.equal(m.data.orderId, '42');
  assert.equal(m.data.skip, undefined);
});

test('promotions use a normal-priority android channel of their own', () => {
  const { buildMessage } = require('../services/firebaseAdmin');
  const m = buildMessage({ title: 'Sale', body: '50% off', category: 'promotion' });
  assert.equal(m.android.notification.channelId, 'promotions');
  assert.equal(m.android.priority, 'normal');
  assert.equal(m.data.link, '/');
});

test('initialises from a base64 FIREBASE_SERVICE_ACCOUNT', () => {
  process.env.FIREBASE_SERVICE_ACCOUNT = Buffer.from(JSON.stringify(serviceAccount)).toString('base64');
  // fresh module instance so init() runs again with the new env
  for (const key of Object.keys(require.cache)) {
    if (key.endsWith('firebaseAdmin.js')) delete require.cache[key];
  }
  const fb = require('../services/firebaseAdmin');
  assert.equal(fb.isPushEnabled(), true);
});
