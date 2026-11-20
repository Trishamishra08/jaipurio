/**
 * Claude connector HTTP routes:
 *   /.well-known/oauth-protected-resource[/api/mcp]   resource metadata
 *   /.well-known/oauth-authorization-server[/...]     authorization server metadata
 *   /oauth/authorize                                  admin sign-in + permission choice
 *   /api/oauth/register                               dynamic client registration
 *   /api/oauth/token                                  code / refresh -> access token
 *   /api/mcp                                          JSON-RPC endpoint
 */
const express = require('express');
const {
  ACCESS_TTL, CODE_TTL, CONSENT_TTL, REFRESH_TTL, GRANTABLE, MCP_SERVER_NAME,
  ALLOWED_ORIGIN_HOSTS, baseFor, knownHosts, mcpEnabled, redirectAllowed,
} = require('./config');
const { sign, verify, pkceMatches } = require('./crypto');
const { authenticate, bearerFrom, checkAdminLogin, issueAccessToken, loadAdmin } = require('./auth');
const { rateLimited, consumeOnce, clientIp } = require('./limits');
const { handleRpc } = require('./server');
const { audit, credentialGet } = require('./store');

const router = express.Router();

const noStore = (res) => res.set({ 'Cache-Control': 'no-store', Pragma: 'no-cache' });
const cors = (res) =>
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, Mcp-Protocol-Version, Mcp-Session-Id',
    'Access-Control-Expose-Headers': 'WWW-Authenticate',
  });
const oauthError = (res, error, description, status = 400) =>
  noStore(cors(res)).status(status).json({ error, error_description: description });
const disabled = (req, res, next) =>
  mcpEnabled() ? next() : oauthError(res, 'temporarily_unavailable', 'Connector disabled', 503);

const escapeHtml = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const withQuery = (uri, q) => {
  const u = new URL(uri);
  for (const [k, v] of Object.entries(q)) if (v !== undefined && v !== '') u.searchParams.set(k, v);
  return u.toString();
};

// ---- metadata -------------------------------------------------------------

const resourceMetadata = (req, res) => {
  const b = baseFor(req);
  cors(res).json({
    resource: `${b}/api/mcp`,
    authorization_servers: [b],
    scopes_supported: GRANTABLE,
    bearer_methods_supported: ['header'],
    resource_name: MCP_SERVER_NAME,
  });
};

const serverMetadata = (req, res) => {
  const b = baseFor(req);
  cors(res).json({
    issuer: b,
    authorization_endpoint: `${b}/oauth/authorize`,
    token_endpoint: `${b}/api/oauth/token`,
    registration_endpoint: `${b}/api/oauth/register`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none'],
    scopes_supported: GRANTABLE,
  });
};

router.get(/^\/\.well-known\/oauth-protected-resource(\/.*)?$/, resourceMetadata);
router.get(/^\/api\/mcp\/\.well-known\/oauth-protected-resource$/, resourceMetadata);
router.get(/^\/\.well-known\/(oauth-authorization-server|openid-configuration)(\/.*)?$/, serverMetadata);

// ---- dynamic client registration ------------------------------------------

router.options('/api/oauth/register', (req, res) => cors(res).sendStatus(204));
router.post('/api/oauth/register', disabled, (req, res) => {
  if (rateLimited(`oauth-register:${clientIp(req)}`, 20)) return oauthError(res, 'slow_down', 'Too many requests.', 429);
  const body = req.body || {};
  const uris = body.redirect_uris;
  if (!Array.isArray(uris) || !uris.length || uris.length > 5) return oauthError(res, 'invalid_redirect_uri', 'redirect_uris is required.');
  if (!uris.every((u) => typeof u === 'string' && redirectAllowed(u))) {
    return oauthError(res, 'invalid_redirect_uri', 'This redirect URI is not allowed.');
  }
  const name = String(body.client_name || 'MCP client').replace(/<[^>]*>/g, '').slice(0, 100);
  const clientId = sign({ typ: 'client', ru: uris, n: name });
  noStore(cors(res)).status(201).json({
    client_id: clientId,
    client_name: name,
    redirect_uris: uris,
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    token_endpoint_auth_method: 'none',
    client_id_issued_at: Math.floor(Date.now() / 1000),
  });
});

// ---- authorize (admin sign-in + permissions) -------------------------------

const validateAuthParams = (p) => {
  const client = verify(p.client_id, 'client');
  const uris = Array.isArray(client?.ru) ? client.ru : [];
  if (!client || !uris.includes(p.redirect_uri) || !redirectAllowed(p.redirect_uri)) return 'Unknown client or redirect URI.';
  if (p.response_type !== 'code' || p.code_challenge_method !== 'S256' || String(p.code_challenge || '').length < 43) {
    return 'Use response_type=code with PKCE (S256).';
  }
  return {
    params: {
      client_id: p.client_id,
      redirect_uri: p.redirect_uri,
      state: p.state || '',
      code_challenge: p.code_challenge,
      scope: p.scope || '',
    },
    clientName: String(client.n || 'MCP client'),
    clientJti: String(client.jti),
  };
};

const PERMS = {
  read: ['Read', 'Products, categories, blogs, pages, city pages, FAQs, menus, redirects, media. Customer contact details stay hidden.', true],
  write: ['Edit', 'Change text and SEO, create drafts, publish when asked. Prices, stock and orders stay locked.', true],
  delete: ['Delete', 'Permanently delete blogs, pages, FAQs, redirects. Leave off unless needed.', false],
  secrets: ['API keys', 'Save or remove API keys (Search Console, Bing, PageSpeed). Keys can never be read back.', false],
};

// After Allow the form post is answered with a 303 to Claude's callback. Browsers apply the
// page's form-action rule to that redirect too, so the client's own (already validated)
// callback origin must be listed next to 'self' or the browser stops on this page.
const page = (res, body, status = 200, redirectUri = null) =>
  res
    .status(status)
    .set({
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Frame-Options': 'DENY',
      'Content-Security-Policy': `default-src 'none'; style-src 'unsafe-inline'; form-action 'self'${
        redirectUri ? ` ${new URL(redirectUri).origin}` : ''
      }; frame-ancestors 'none'`,
      'X-Robots-Tag': 'noindex, nofollow',
    })
    .send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Connect Claude · ${escapeHtml(MCP_SERVER_NAME)}</title>
<style>
:root{--bg:#faf7f2;--card:#fff;--ink:#1f2937;--muted:#6b7280;--line:#e5e7eb;--brand:#9a3412;--brand-ink:#fff}
@media (prefers-color-scheme:dark){:root{--bg:#111;--card:#1c1c1c;--ink:#f3f4f6;--muted:#9ca3af;--line:#333;--brand:#ea7a3c;--brand-ink:#111}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:16px}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;max-width:460px;width:100%;padding:28px}
h1{font-size:20px;margin:0 0 6px}p{margin:0 0 16px;color:var(--muted)}
.field{display:block;margin-bottom:12px}.field span{display:block;font-size:14px;margin-bottom:4px}
.field input{width:100%;padding:10px 12px;border:1px solid var(--line);border-radius:8px;font:inherit;background:transparent;color:var(--ink)}
label.perm{display:flex;gap:10px;align-items:flex-start;padding:12px;border:1px solid var(--line);border-radius:10px;margin-bottom:10px;cursor:pointer}
label.perm small{display:block;color:var(--muted)}input[type=checkbox]{margin-top:4px;accent-color:var(--brand);width:18px;height:18px}
.row{display:flex;gap:10px;margin-top:18px}button{flex:1;border-radius:10px;padding:12px;font-size:15px;font-weight:600;border:1px solid var(--line);background:transparent;color:var(--ink);cursor:pointer}
button.primary{background:var(--brand);border-color:var(--brand);color:var(--brand-ink)}.err{color:#b91c1c;font-weight:600}
</style></head><body><main class="card">${body}</main></body></html>`);

const authorizeForm = (v, { error = '', email = '', needs2fa = false, chosen = null } = {}) => {
  const consent = sign({ typ: 'consent', cid: v.clientJti, ru: v.params.redirect_uri }, CONSENT_TTL);
  const hidden = Object.entries({ ...v.params, response_type: 'code', code_challenge_method: 'S256', consent })
    .map(([k, val]) => `<input type="hidden" name="${escapeHtml(k)}" value="${escapeHtml(val)}">`)
    .join('');
  const perms = GRANTABLE.map((a) => {
    const [title, help, def] = PERMS[a];
    const checked = chosen ? chosen.includes(a) : def;
    return `<label class="perm"><input type="checkbox" name="abilities" value="${a}"${checked ? ' checked' : ''}><span><strong>${title}</strong><small>${help}</small></span></label>`;
  }).join('');
  return `<h1>Connect Claude to ${escapeHtml(MCP_SERVER_NAME)}</h1>
<p>${escapeHtml(v.clientName)} wants to manage this shop's admin on your behalf. Sign in with your Jaipurio admin account.</p>
${error ? `<p class="err">${escapeHtml(error)}</p>` : ''}
<form method="post" action="/oauth/authorize" autocomplete="on">${hidden}
<label class="field"><span>Admin email</span><input type="email" name="email" value="${escapeHtml(email)}" required autocomplete="username"></label>
<label class="field"><span>Password</span><input type="password" name="password" required autocomplete="current-password"></label>
${needs2fa ? '<label class="field"><span>Authenticator code</span><input name="totp" inputmode="numeric" autocomplete="one-time-code" maxlength="6" required></label>' : ''}
${perms}
<div class="row"><button type="submit" name="decision" value="deny" formnovalidate>Deny</button><button class="primary" type="submit" name="decision" value="approve">Allow</button></div>
</form>`;
};

router.get('/oauth/authorize', (req, res) => {
  if (!mcpEnabled()) return page(res, '<h1>Connector switched off</h1><p>The site owner has turned the Claude connector off.</p>', 503);
  const v = validateAuthParams(req.query || {});
  if (typeof v === 'string') return page(res, `<h1>Cannot connect</h1><p class="err">${escapeHtml(v)}</p>`, 400);
  return page(res, authorizeForm(v), 200, v.params.redirect_uri);
});

router.post('/oauth/authorize', async (req, res, next) => {
  try {
    if (!mcpEnabled()) return page(res, '<h1>Connector switched off</h1>', 503);
    const origin = req.headers.origin;
    if (origin && origin !== 'null') {
      let host = '';
      try {
        host = new URL(origin).host.toLowerCase();
      } catch {
        /* bad origin */
      }
      const own = new URL(baseFor(req)).host;
      if (host !== own && host !== String(req.headers.host || '').toLowerCase() && !knownHosts().includes(host)) {
        return page(res, '<h1>Blocked</h1><p class="err">Cross-site request blocked.</p>', 403);
      }
    }
    const p = req.body || {};
    const v = validateAuthParams(p);
    if (typeof v === 'string') return page(res, `<h1>Cannot connect</h1><p class="err">${escapeHtml(v)}</p>`, 400);
    const back = (q) => res.redirect(303, withQuery(v.params.redirect_uri, { ...q, state: v.params.state || undefined }));

    if (p.decision !== 'approve') return back({ error: 'access_denied', error_description: 'The admin denied access.' });

    const consent = verify(p.consent, 'consent');
    if (!consent || consent.cid !== v.clientJti || consent.ru !== v.params.redirect_uri) {
      return page(res, '<h1>Session expired</h1><p class="err">Go back to Claude and start the connection again.</p>', 400);
    }
    const raw = p.abilities;
    const chosen = (Array.isArray(raw) ? raw : raw ? [raw] : []).filter((a) => GRANTABLE.includes(a));
    const ip = clientIp(req);
    if (rateLimited(`oauth-login:${ip}`, 10)) {
      return page(res, authorizeForm(v, { error: 'Too many attempts. Wait a minute and try again.', email: p.email, chosen }), 429, v.params.redirect_uri);
    }
    const login = await checkAdminLogin(p.email, p.password, p.totp);
    if (login.error) {
      await audit({ user: String(p.email || '').slice(0, 120), tool: 'oauth_login', ip, ok: false, error: login.error });
      return page(res, authorizeForm(v, { error: login.error, email: p.email, needs2fa: login.needs2fa, chosen }), 401, v.params.redirect_uri);
    }
    if (!chosen.includes('read') && chosen.length) chosen.unshift('read');
    if (!chosen.length) return back({ error: 'access_denied', error_description: 'No permission was granted.' });

    const { user, pv } = login.admin;
    const code = sign(
      { typ: 'code', sub: String(user._id), pv, ab: chosen, cid: v.clientJti, ru: v.params.redirect_uri, cc: v.params.code_challenge },
      CODE_TTL
    );
    await audit({ user: user.email, tool: 'oauth_authorize', ip, ok: true, args: { abilities: chosen, client: v.clientName } });
    return back({ code });
  } catch (e) {
    return next(e);
  }
});

// ---- token -----------------------------------------------------------------

router.options('/api/oauth/token', (req, res) => cors(res).sendStatus(204));
router.post('/api/oauth/token', disabled, async (req, res, next) => {
  try {
    const ip = clientIp(req);
    if (rateLimited(`oauth-token:${ip}`, 30)) return oauthError(res, 'slow_down', 'Too many requests.', 429);
    const p = req.body || {};
    const client = verify(p.client_id, 'client');
    if (!client) return oauthError(res, 'invalid_client', 'Unknown client.', 401);
    const clientJti = String(client.jti);
    let userId;
    let abilities;
    let pv;
    if (p.grant_type === 'authorization_code') {
      const code = verify(p.code, 'code');
      if (!code || code.cid !== clientJti) return oauthError(res, 'invalid_grant', 'The code is invalid or expired.');
      if (code.ru !== p.redirect_uri) return oauthError(res, 'invalid_grant', 'redirect_uri mismatch.');
      if (!pkceMatches(p.code_verifier || '', String(code.cc || ''))) return oauthError(res, 'invalid_grant', 'PKCE verification failed.');
      if (!consumeOnce(String(code.jti), CODE_TTL * 1000 + 60_000)) return oauthError(res, 'invalid_grant', 'The code was already used.');
      ({ sub: userId, ab: abilities, pv } = code);
    } else if (p.grant_type === 'refresh_token') {
      const rt = verify(p.refresh_token, 'refresh');
      if (!rt || rt.cid !== clientJti) return oauthError(res, 'invalid_grant', 'The refresh token is invalid or expired.');
      if (!consumeOnce(String(rt.jti), REFRESH_TTL * 1000)) return oauthError(res, 'invalid_grant', 'The refresh token was already used.');
      ({ sub: userId, ab: abilities, pv } = rt);
    } else {
      return oauthError(res, 'unsupported_grant_type', 'Use authorization_code or refresh_token.');
    }
    abilities = (Array.isArray(abilities) ? abilities : []).filter((a) => GRANTABLE.includes(a));
    const admin = await loadAdmin(userId);
    if (!admin) return oauthError(res, 'invalid_grant', 'The account is no longer an admin.');
    if (admin.pv !== pv) return oauthError(res, 'invalid_grant', 'The admin password changed: connect again.');
    const access = issueAccessToken(admin.user._id, admin.pv, abilities, clientJti);
    const refresh = sign({ typ: 'refresh', sub: String(admin.user._id), pv: admin.pv, ab: abilities, cid: clientJti }, REFRESH_TTL);
    await audit({ user: admin.user.email, tool: `oauth_${p.grant_type}`, ip, ok: true, args: { abilities } });
    return noStore(cors(res)).json({
      access_token: access,
      token_type: 'Bearer',
      expires_in: ACCESS_TTL,
      refresh_token: refresh,
      scope: abilities.join(' '),
    });
  } catch (e) {
    return next(e);
  }
});

// ---- IndexNow key file (keyLocation for seo_indexnow_submit) ------------------

router.get('/api/indexnow/:file', async (req, res) => {
  const key = await credentialGet('indexnow_key');
  if (!key || req.params.file !== `${key}.txt`) return res.sendStatus(404);
  return res.type('text/plain').send(key);
});

// ---- MCP endpoint ------------------------------------------------------------

const originAllowed = (req) => {
  const origin = req.headers.origin;
  if (!origin) return true;
  let host;
  try {
    host = new URL(origin).hostname.toLowerCase();
  } catch {
    return false;
  }
  return ALLOWED_ORIGIN_HOSTS.includes(host) || knownHosts().includes(host) || ['localhost', '127.0.0.1'].includes(host);
};

router.options('/api/mcp', (req, res) => cors(res).sendStatus(204));
router.get('/api/mcp', (req, res) => cors(res).set('Allow', 'POST').status(405).json({ error: 'Use POST' }));
router.delete('/api/mcp', (req, res) => cors(res).sendStatus(405));

router.post('/api/mcp', async (req, res, next) => {
  try {
    cors(res);
    if (!mcpEnabled()) return res.status(503).json({ jsonrpc: '2.0', id: null, error: { code: -32000, message: 'Connector disabled' } });
    if (!originAllowed(req)) return res.status(403).json({ jsonrpc: '2.0', id: null, error: { code: -32000, message: 'Origin not allowed' } });
    const ip = clientIp(req);
    if (rateLimited(`mcp-ip:${ip}`, 1000)) return res.status(429).json({ error: 'Too many requests' });
    const base = baseFor(req);
    const token = bearerFrom(req);
    const auth = token ? await authenticate(token) : null;
    if (!auth) {
      if (token && rateLimited(`mcp-badauth:${ip}`, 20)) return res.status(429).json({ error: 'Too many failed sign-ins' });
      return res
        .status(401)
        .set('WWW-Authenticate', `Bearer resource_metadata="${base}/.well-known/oauth-protected-resource/api/mcp"`)
        .json({ jsonrpc: '2.0', id: null, error: { code: -32001, message: 'Unauthorized' } });
    }
    if (rateLimited(`mcp-token:${auth.jti}`, 120)) return res.status(429).json({ error: 'Too many requests for this connection' });
    const ctx = { ...auth, ip, base, req };
    const body = req.body;
    if (Array.isArray(body)) {
      if (!body.length || body.length > 20) return res.status(400).json({ jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Batch of 1-20 messages' } });
      const out = (await Promise.all(body.map((m) => handleRpc(m, ctx)))).filter(Boolean);
      return out.length ? res.json(out) : res.sendStatus(202);
    }
    if (!body || typeof body !== 'object') return res.status(400).json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } });
    const out = await handleRpc(body, ctx);
    return out ? res.json(out) : res.sendStatus(202);
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
