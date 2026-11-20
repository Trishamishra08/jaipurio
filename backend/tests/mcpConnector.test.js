// Claude connector: OAuth flow, MCP endpoint and content-tool guards.
// Run: npm test   (no database: the User/Blog models and the connector store are stubbed)
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');

const resolve = (p) => require.resolve(path.join(__dirname, '..', p));
const stub = (file, exports) => {
  require.cache[resolve(file)] = { id: resolve(file), filename: resolve(file), loaded: true, exports };
};

process.env.MCP_SECRET = 'test-mcp-secret';
process.env.SITE_URL = 'https://jaipurio.in';

// ---- stubs -------------------------------------------------------------------
let admin;
const userById = () => ({ select: async () => admin });
stub('models/userModel.js', {
  findById: userById,
  findOne: ({ email }) => ({ select: async () => (admin && email === admin.email ? admin : null) }),
});

const audits = [];
stub('mcp/store.js', {
  McpAudit: { find: () => ({ sort: () => ({ limit: () => ({ lean: async () => audits }) }) }) },
  audit: async (e) => audits.push(e),
  storeGet: async () => null,
  storeSet: async (_k, v) => v,
  credentialGet: async () => null,
  credentialSet: async () => {},
  credentialRemove: async () => true,
  credentialStatus: async (names) => names.map((name) => ({ name, set: false })),
});

const blogs = new Map();
class FakeBlog {
  constructor(data) {
    Object.assign(this, { _id: crypto.randomBytes(12).toString('hex'), status: 'Published' }, data);
  }
  static async create(data) {
    const d = new FakeBlog(data);
    blogs.set(d._id, d);
    return d;
  }
  static async findById(id) {
    return blogs.get(String(id)) || null;
  }
  static async findOne({ slug }) {
    return [...blogs.values()].find((b) => b.slug === slug) || null;
  }
  static async countDocuments() {
    return blogs.size;
  }
  get(k) {
    return this[k];
  }
  set(k, v) {
    if (typeof k === 'object') Object.assign(this, k);
    else this[k] = v;
  }
  async save() {
    blogs.set(this._id, this);
  }
  toObject() {
    return { ...this };
  }
}
stub('models/blogModel.js', FakeBlog);

let settingsDoc = null;
stub('models/settingsModel.js', class FakeSettings {
  static async findOne() {
    return settingsDoc;
  }
  async save() {
    settingsDoc = this;
  }
});
stub('utils/cache.js', { invalidateCatalog: async () => {} });

const express = require('express');
const { _reset } = require('../mcp/limits');
const { verify } = require('../mcp/crypto');
const { redirectAllowed } = require('../mcp/config');
const { redact } = require('../mcp/redact');
const { auditHtml } = require('../mcp/htmlAudit');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(require('../mcp/routes'));

let base;
let server;
test.before(async () => {
  admin = {
    _id: 'a'.repeat(24),
    email: 'admin@jaipurio.in',
    role: 'admin',
    isBlocked: false,
    twoFactorEnabled: false,
    password: await bcrypt.hash('correct-horse', 4),
    async save() {},
  };
  await new Promise((r) => {
    server = app.listen(0, '127.0.0.1', r);
  });
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => server.close());
test.beforeEach(() => _reset());

const REDIRECT = 'https://claude.ai/api/mcp/auth_callback';
const verifier = crypto.randomBytes(40).toString('base64url');
const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');

const register = async () => {
  const r = await fetch(`${base}/api/oauth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_name: 'Claude', redirect_uris: [REDIRECT] }),
  });
  assert.equal(r.status, 201);
  return (await r.json()).client_id;
};

const authParams = (clientId) => ({
  client_id: clientId,
  redirect_uri: REDIRECT,
  response_type: 'code',
  code_challenge: challenge,
  code_challenge_method: 'S256',
  state: 'st8',
});

const consentFrom = async (clientId) => {
  const r = await fetch(`${base}/oauth/authorize?${new URLSearchParams(authParams(clientId))}`);
  assert.equal(r.status, 200);
  const html = await r.text();
  assert.match(html, /Admin email/);
  return html.match(/name="consent" value="([^"]+)"/)[1];
};

const approve = async (clientId, { password = 'correct-horse', abilities = ['read', 'write'] } = {}) => {
  const consent = await consentFrom(clientId);
  const form = new URLSearchParams({ ...authParams(clientId), consent, email: admin.email, password, decision: 'approve' });
  for (const a of abilities) form.append('abilities', a);
  return fetch(`${base}/oauth/authorize`, { method: 'POST', body: form, redirect: 'manual' });
};

const connect = async (abilities) => {
  const clientId = await register();
  const r = await approve(clientId, { abilities });
  assert.equal(r.status, 303);
  const loc = new URL(r.headers.get('location'));
  assert.equal(loc.searchParams.get('state'), 'st8');
  const code = loc.searchParams.get('code');
  const t = await fetch(`${base}/api/oauth/token`, {
    method: 'POST',
    body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: REDIRECT, client_id: clientId, code_verifier: verifier }),
  });
  assert.equal(t.status, 200);
  return { ...(await t.json()), clientId, code };
};

const rpc = (token, method, params, id = 1) =>
  fetch(`${base}/api/mcp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
  }).then(async (r) => ({ status: r.status, body: await r.json() }));

const call = async (token, name, args) => {
  const r = await rpc(token, 'tools/call', { name, arguments: args });
  return r.body.result;
};

// ---- tests ----------------------------------------------------------------------

test('metadata endpoints describe the server', async () => {
  const pr = await (await fetch(`${base}/.well-known/oauth-protected-resource/api/mcp`)).json();
  assert.equal(pr.resource, `${base}/api/mcp`);
  const as = await (await fetch(`${base}/.well-known/oauth-authorization-server`)).json();
  assert.equal(as.token_endpoint, `${base}/api/oauth/token`);
  assert.deepEqual(as.code_challenge_methods_supported, ['S256']);
});

test('unauthenticated MCP call gets 401 pointing at the resource metadata', async () => {
  const r = await fetch(`${base}/api/mcp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"jsonrpc":"2.0","id":1,"method":"ping"}' });
  assert.equal(r.status, 401);
  assert.match(r.headers.get('www-authenticate'), /resource_metadata=".*\/\.well-known\/oauth-protected-resource\/api\/mcp"/);
});

test('only claude.ai and localhost redirect URIs can register', async () => {
  assert.equal(redirectAllowed('https://claude.ai/api/mcp/auth_callback'), true);
  assert.equal(redirectAllowed('http://localhost:3000/cb'), true);
  assert.equal(redirectAllowed('https://evil.example/cb'), false);
  assert.equal(redirectAllowed('http://claude.ai/cb'), false);
  const r = await fetch(`${base}/api/oauth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ redirect_uris: ['https://evil.example/cb'] }) });
  assert.equal(r.status, 400);
});

test('sign-in page lets the browser follow the redirect back to Claude after Allow', async () => {
  const clientId = await register();
  const r = await fetch(`${base}/oauth/authorize?${new URLSearchParams(authParams(clientId))}`);
  const csp = r.headers.get('content-security-policy');
  const formAction = csp.split(';').map((d) => d.trim()).find((d) => d.startsWith('form-action'));
  assert.ok(formAction.split(/\s+/).includes('https://claude.ai'), csp);
  assert.ok(!formAction.includes('*'));
});

test('wrong password shows the form again, no code', async () => {
  const r = await approve(await register(), { password: 'nope' });
  assert.equal(r.status, 401);
  assert.match(await r.text(), /Wrong email or password/);
});

test('non-admin account cannot connect', async () => {
  const saved = admin.role;
  admin.role = 'user';
  const r = await approve(await register());
  admin.role = saved;
  assert.equal(r.status, 401);
});

test('full flow: code is single use, PKCE checked, tools listed by permission', async () => {
  const { access_token, refresh_token, clientId, code } = await connect(['read']);
  assert.ok(access_token.startsWith('jp_mcp_'));
  assert.deepEqual(verify(access_token, 'access').ab, ['read']);

  const again = await fetch(`${base}/api/oauth/token`, {
    method: 'POST',
    body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: REDIRECT, client_id: clientId, code_verifier: verifier }),
  });
  assert.equal(again.status, 400);

  const init = await rpc(access_token, 'initialize', { protocolVersion: '2025-06-18' });
  assert.equal(init.body.result.serverInfo.name, 'Jaipurio');

  const list = await rpc(access_token, 'tools/list');
  const names = list.body.result.tools.map((t) => t.name);
  assert.ok(names.includes('get') && names.includes('seo_audit_page'));
  assert.ok(!names.includes('update'), 'read-only connection must not list write tools');

  const denied = await call(access_token, 'update', { collection: 'blog', id: 'x', data: {} });
  assert.equal(denied.isError, true);
  assert.match(denied.content[0].text, /permission/);

  const rt = await fetch(`${base}/api/oauth/token`, {
    method: 'POST',
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token, client_id: clientId }),
  });
  assert.equal(rt.status, 200);
});

test('a bad PKCE verifier is refused', async () => {
  const clientId = await register();
  const r = await approve(clientId);
  const code = new URL(r.headers.get('location')).searchParams.get('code');
  const t = await fetch(`${base}/api/oauth/token`, {
    method: 'POST',
    body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: REDIRECT, client_id: clientId, code_verifier: 'x'.repeat(50) }),
  });
  assert.equal(t.status, 400);
  assert.match((await t.json()).error_description, /PKCE/);
});

test('password change invalidates the access token', async () => {
  const { access_token } = await connect(['read']);
  const saved = admin.password;
  admin.password = await bcrypt.hash('new-password', 4);
  const r = await rpc(access_token, 'ping');
  admin.password = saved;
  assert.equal(r.status, 401);
});

test('content tools: drafts by default, locked and unknown fields refused, live slug kept', async () => {
  const { access_token } = await connect(['read', 'write']);
  const created = await call(access_token, 'create', { collection: 'blog', data: { title: 'Blue pottery care', slug: 'blue-pottery-care', content: '<p>x</p>' } });
  assert.ok(!created.isError, created.content?.[0]?.text);
  const id = created.structuredContent.created.id;
  assert.equal(blogs.get(id).status, 'Draft');

  const unknown = await call(access_token, 'update', { collection: 'blog', id, data: { views: 9 } });
  assert.equal(unknown.isError, true);
  assert.match(unknown.content[0].text, /cannot be set/);

  const locked = await call(access_token, 'update', { collection: 'blog', id, data: { legacyId: 1 } });
  assert.match(locked.content[0].text, /locked/);

  const pub = await call(access_token, 'publish', { collection: 'blog', id, published: true });
  assert.ok(!pub.isError);
  const slug = await call(access_token, 'update', { collection: 'blog', id, data: { slug: 'new-slug' } });
  assert.equal(slug.isError, true);
  assert.equal(blogs.get(id).slug, 'blue-pottery-care');

  const ok = await call(access_token, 'update', { collection: 'blog', id, data: { excerpt: 'How to keep blue pottery bright.' } });
  assert.ok(!ok.isError);
  assert.equal(blogs.get(id).excerpt, 'How to keep blue pottery bright.');

  const schema = await call(access_token, 'seo_set', { collection: 'blog', id, schemaMarkup: '{"@type":"Product","aggregateRating":{"ratingValue":5}}' });
  assert.match(schema.content[0].text, /Ratings/);
  assert.ok(audits.some((a) => a.tool === 'update' && a.ok === true));
});

test('redaction hides secrets and customer contact details', () => {
  const out = redact({ name: 'A', password: 'x', email: 'a@b.c', nested: [{ phone: '99', city: 'Jaipur' }], twoFactorSecret: 's' });
  assert.deepEqual(out, { name: 'A', email: '[hidden]', nested: [{ phone: '[hidden]', city: 'Jaipur' }] });
});

test('page audit finds missing H1, alt text and bad JSON-LD', () => {
  const html = `<html lang="en"><head><title>Blue Pottery Vase</title><link rel="canonical" href="https://jaipurio.in/x">
  <script type="application/ld+json">{bad json</script></head><body><img src="a.jpg"><a href="/shop">Shop</a></body></html>`;
  const r = auditHtml(html, 'https://jaipurio.in/x');
  const codes = r.issues.map((i) => i.code);
  assert.ok(codes.includes('h1_missing'));
  assert.ok(codes.includes('img_alt'));
  assert.ok(codes.includes('schema_invalid'));
  assert.ok(codes.includes('description_missing'));
  assert.equal(r.internalLinks, 1);
});

test('connector kill switch', async () => {
  process.env.MCP_ENABLED = 'false';
  const r = await fetch(`${base}/api/mcp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  delete process.env.MCP_ENABLED;
  assert.equal(r.status, 503);
});

test('tracking_set saves a real GA4 id and refuses placeholders', async () => {
  const { access_token } = await connect(['read', 'write']);
  const bad = await call(access_token, 'tracking_set', { googleAnalyticsId: 'G-XXXXXXXXXX' });
  assert.equal(bad.isError, true);
  const ok = await call(access_token, 'tracking_set', { googleAnalyticsId: 'g-efcwdl7y3k' });
  assert.ok(!ok.isError, ok.content?.[0]?.text);
  assert.equal(settingsDoc.googleAnalyticsId, 'G-EFCWDL7Y3K');
  const badPx = await call(access_token, 'tracking_set', { facebookPixelId: 'abc' });
  assert.equal(badPx.isError, true);
  const px = await call(access_token, 'tracking_set', { facebookPixelId: '1003264154124222' });
  assert.ok(!px.isError, px.content?.[0]?.text);
  assert.equal(settingsDoc.theme.facebookPixelId, '1003264154124222');
  assert.equal(settingsDoc.googleAnalyticsId, 'G-EFCWDL7Y3K');
});
