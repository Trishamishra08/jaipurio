/** Stateless signed tokens (HMAC-SHA256) and PKCE for the Claude connector. */
const crypto = require('crypto');

const PREFIX = {
  access: 'jp_mcp_',
  refresh: 'jp_rt_',
  code: 'jp_code_',
  client: 'jp_client_',
  consent: 'jp_consent_',
};

const secret = () => {
  const s = process.env.MCP_SECRET || process.env.JWT_ACCESS_SECRET;
  if (!s && process.env.NODE_ENV === 'production') throw new Error('MCP_SECRET or JWT_ACCESS_SECRET must be set');
  return crypto.createHash('sha256').update(`jaipurio-mcp:v1:${s || 'dev-only-secret'}`).digest();
};

const b64 = (buf) => Buffer.from(buf).toString('base64url');

/** Sign a payload. ttl in seconds; omit for a token that never expires (client ids). */
const sign = (payload, ttl) => {
  const typ = payload.typ;
  if (!PREFIX[typ]) throw new Error(`unknown token type ${typ}`);
  const body = { ...payload, jti: crypto.randomBytes(12).toString('hex'), iat: Math.floor(Date.now() / 1000) };
  if (ttl) body.exp = body.iat + ttl;
  const data = b64(JSON.stringify(body));
  const mac = b64(crypto.createHmac('sha256', secret()).update(`${typ}.${data}`).digest());
  return `${PREFIX[typ]}${data}.${mac}`;
};

/** Verify a token of the given type. Returns its payload or null. */
const verify = (token, typ) => {
  if (typeof token !== 'string' || !PREFIX[typ] || !token.startsWith(PREFIX[typ])) return null;
  const [data, mac] = token.slice(PREFIX[typ].length).split('.');
  if (!data || !mac) return null;
  const want = crypto.createHmac('sha256', secret()).update(`${typ}.${data}`).digest();
  let got;
  try {
    got = Buffer.from(mac, 'base64url');
  } catch {
    return null;
  }
  if (got.length !== want.length || !crypto.timingSafeEqual(got, want)) return null;
  let body;
  try {
    body = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (body.typ !== typ) return null;
  if (body.exp && body.exp < Math.floor(Date.now() / 1000)) return null;
  return body;
};

const pkceMatches = (verifier, challenge) => {
  if (typeof verifier !== 'string' || verifier.length < 43 || verifier.length > 128) return false;
  const calc = Buffer.from(b64(crypto.createHash('sha256').update(verifier).digest()));
  const want = Buffer.from(String(challenge || ''));
  return calc.length === want.length && crypto.timingSafeEqual(calc, want);
};

/** Short fingerprint of the stored password hash: changes when the password changes. */
const passwordFingerprint = (hash) =>
  crypto.createHash('sha256').update(`pv:${hash || ''}`).digest('hex').slice(0, 16);

module.exports = { sign, verify, pkceMatches, passwordFingerprint, PREFIX };
