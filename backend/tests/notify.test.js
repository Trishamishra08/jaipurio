// Run: npm test   (Node's built-in runner; no database or Firebase needed — models are stubbed)
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const resolve = (p) => require.resolve(path.join(__dirname, '..', p));

// ── stubs injected before notify.js is loaded ─────────────────────────────
const state = { inbox: [], devices: [], users: new Map(), vendors: new Map(), admins: [], sent: [], dead: [], removed: [] };

const chain = (value) => ({
  select: () => chain(value),
  populate: () => chain(value),
  lean: async () => value,
  then: (res, rej) => Promise.resolve(value).then(res, rej),
});

const stub = (file, exports) => {
  require.cache[resolve(file)] = { id: resolve(file), filename: resolve(file), loaded: true, exports };
};

stub('models/notificationModel.js', { create: async (doc) => { const saved = { _id: `n${state.inbox.length + 1}`, ...doc }; state.inbox.push(saved); return saved; } });
stub('models/deviceTokenModel.js', {
  find: (q) => chain(state.devices.filter((d) => d.role === q.role && (!q.owner || q.owner.$in.map(String).includes(String(d.owner))))),
  deleteMany: async (q) => { state.removed.push(...q.token.$in); },
});
stub('models/userModel.js', {
  findById: (id) => chain(state.users.get(String(id)) || null),
  find: () => chain(state.admins),
});
stub('models/vendorModel.js', { findById: (id) => chain(state.vendors.get(String(id)) || null), find: () => chain([]) });
stub('services/firebaseAdmin.js', {
  sendToTokens: async (tokens, payload) => { state.sent.push({ tokens, payload }); return { successCount: tokens.length, failureCount: 0, deadTokens: state.dead }; },
});

const { notify, render, orderRef, orderVendorIds } = require('../services/notify');
const { EVENTS, ALWAYS_ON } = require('../services/notificationEvents');
const { chatRecipient } = require('../controllers/notificationController.js');

const reset = () => {
  Object.assign(state, { inbox: [], devices: [], users: new Map(), vendors: new Map(), admins: [], sent: [], dead: [], removed: [] });
};
const flush = () => new Promise((r) => setImmediate(() => setImmediate(r)));

const ID = (n) => String(n).padStart(24, '0');

test('templates never expose a Mongo id and use the order number', () => {
  const r = render('order.shipped', { orderNumber: 'JP-1042', awb: 'AWB9', courier: 'Delhivery' });
  assert.match(r.body, /JP-1042/);
  assert.match(r.body, /AWB9/);
  assert.doesNotMatch(r.body, /[a-f0-9]{24}/);
  assert.equal(r.link, '/orders');
});

test('every event renders title, body and link without throwing on empty data', () => {
  for (const key of Object.keys(EVENTS)) {
    const r = render(key, {});
    assert.ok(typeof r.title === 'string' && r.title.length > 0, `${key} title`);
    assert.ok(typeof r.body === 'string', `${key} body`);
    assert.ok(typeof r.link === 'string', `${key} link`);
  }
});

test('links point into the right module', () => {
  assert.equal(render('vendor.order_new', { orderNumber: 'X' }).link, '/vendor/orders');
  assert.equal(render('admin.order_new', { orderNumber: 'X', orderId: 'abc' }).link, '/admin/ecommerce/orders/edit/abc');
  assert.equal(render('order.placed', { orderNumber: 'X' }).link, '/orders');
});

test('orderRef prefers orderNumber and never returns a full id', () => {
  assert.equal(orderRef({ orderNumber: 'JP-7' }), 'JP-7');
  assert.equal(orderRef({ _id: '6ae599d136a2256d09332856' }).length, 6);
});

test('orderVendorIds returns each seller once', () => {
  const ids = orderVendorIds({ orderItems: [{ vendor: 'a' }, { vendor: 'a' }, { vendor: { _id: 'b' } }, {}] });
  assert.deepEqual(ids.sort(), ['a', 'b']);
});

test('customer notification: saved to inbox and pushed to that customer\'s devices only', async () => {
  reset();
  state.users.set(ID(1), { _id: ID(1) });
  state.devices = [
    { token: 'tok-mine', role: 'user', owner: ID(1) },
    { token: 'tok-other', role: 'user', owner: ID(2) },
    { token: 'tok-admin', role: 'admin', owner: ID(1) },
  ];
  const saved = await notify({ event: 'order.placed', to: { userId: ID(1) }, data: { orderNumber: 'JP-1', total: 500 } });
  await flush();
  assert.equal(saved.targetRole, 'user');
  assert.equal(String(saved.targetId), ID(1));
  assert.equal(saved.category, 'order');
  assert.equal(state.sent.length, 1);
  assert.deepEqual(state.sent[0].tokens, ['tok-mine']);
  assert.equal(state.sent[0].payload.link, '/orders');
});

test('vendor notification goes to vendor devices, not customer devices', async () => {
  reset();
  state.vendors.set(ID(5), { _id: ID(5) });
  state.devices = [{ token: 'v1', role: 'vendor', owner: ID(5) }, { token: 'u1', role: 'user', owner: ID(5) }];
  await notify({ event: 'vendor.order_new', to: { vendorId: ID(5) }, data: { orderNumber: 'JP-2' } });
  await flush();
  assert.deepEqual(state.sent[0].tokens, ['v1']);
});

test('admin notification only reaches admins whose role covers the event', async () => {
  reset();
  state.admins = [
    { _id: ID(10), adminRole: { permissions: ['all'] } },
    { _id: ID(11), adminRole: { permissions: ['manage_support'] } }, // support only
    { _id: ID(12), adminRole: { permissions: ['manage_orders'] } },
    { _id: ID(13) }, // no role assigned = receives everything
  ];
  state.devices = [10, 11, 12, 13].map((n) => ({ token: `a${n}`, role: 'admin', owner: ID(n) }));
  const saved = await notify({ event: 'admin.order_new', to: { admins: true }, data: { orderNumber: 'JP-3', total: 1 } });
  await flush();
  assert.equal(saved.targetRole, 'admin');
  assert.deepEqual(saved.data, { permission: 'manage_orders' });
  assert.deepEqual(state.sent[0].tokens.sort(), ['a10', 'a12', 'a13']);
});

test('muted optional categories are skipped, transactional ones never are', async () => {
  reset();
  state.users.set(ID(1), { _id: ID(1), notificationPrefs: { muted: ['review', 'order'], promotions: false } });
  state.devices = [{ token: 't', role: 'user', owner: ID(1) }];
  await notify({ event: 'review.replied', to: { userId: ID(1) }, data: { reply: 'Thanks!' } });
  await flush();
  assert.equal(state.sent.length, 0, 'muted review push skipped');
  assert.equal(state.inbox.length, 1, 'inbox row still saved');

  await notify({ event: 'order.placed', to: { userId: ID(1) }, data: { orderNumber: 'JP-4' } });
  await flush();
  assert.equal(state.sent.length, 1, 'order push still sent although "order" was in muted');
  assert.ok(ALWAYS_ON.has('order'));
});

test('dead tokens reported by FCM are deleted', async () => {
  reset();
  state.users.set(ID(1), { _id: ID(1) });
  state.devices = [{ token: 'good', role: 'user', owner: ID(1) }, { token: 'stale', role: 'user', owner: ID(1) }];
  state.dead = ['stale'];
  await notify({ event: 'order.paid', to: { userId: ID(1) }, data: { orderNumber: 'JP-5', total: 9 } });
  await flush();
  assert.deepEqual(state.removed, ['stale']);
});

test('unknown recipient or missing audience returns null and never throws', async () => {
  reset();
  assert.equal(await notify({ event: 'order.placed', to: { userId: ID(99) }, data: {} }), null);
  assert.equal(await notify({ event: 'order.placed', to: {}, data: {} }), null);
  assert.equal(state.inbox.length, 0);
});

test('inbox=false (chat) pushes without saving an inbox row', async () => {
  reset();
  state.users.set(ID(1), { _id: ID(1) });
  state.devices = [{ token: 't', role: 'user', owner: ID(1) }];
  const saved = await notify({ event: 'chat.message', to: { userId: ID(1) }, data: { senderName: 'Jaipurio Support', message: 'Hello', role: 'user' }, inbox: false });
  await flush();
  assert.equal(saved, null);
  assert.equal(state.inbox.length, 0);
  assert.equal(state.sent.length, 1);
  assert.match(state.sent[0].payload.title, /Jaipurio Support/);
});

test('chat: only participants of a conversation may notify its other side', () => {
  const u = ID(1);
  const v = ID(2);
  // customer ↔ admin
  assert.deepEqual(chatRecipient(`user-admin-${u}`, 'user', u)?.to, { admins: true });
  assert.deepEqual(chatRecipient(`user-admin-${u}`, 'admin', ID(9))?.to, { userId: u });
  assert.equal(chatRecipient(`user-admin-${u}`, 'user', ID(3)), null, 'another customer cannot use it');
  assert.equal(chatRecipient(`user-admin-${u}`, 'vendor', u), null, 'a vendor cannot');
  // seller ↔ admin
  assert.deepEqual(chatRecipient(`vendor-admin-${v}`, 'vendor', v)?.to, { admins: true });
  assert.equal(chatRecipient(`vendor-admin-${v}`, 'vendor', ID(4)), null);
  // customer ↔ seller
  assert.deepEqual(chatRecipient(`user-vendor-${u}-${v}`, 'user', u)?.to, { vendorId: v });
  assert.deepEqual(chatRecipient(`user-vendor-${u}-${v}`, 'vendor', v)?.to, { userId: u });
  assert.equal(chatRecipient(`user-vendor-${u}-${v}`, 'user', ID(3)), null);
  // garbage
  assert.equal(chatRecipient('anything', 'admin', u), null);
  assert.equal(chatRecipient(undefined, 'admin', u), null);
});
