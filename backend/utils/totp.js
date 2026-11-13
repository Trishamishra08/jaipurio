// RFC 6238 time-based one-time passwords (Google Authenticator, Authy, 1Password…).
// Dependency-free: only Node's crypto. SHA-1, 6 digits, 30 s step — the defaults
// every authenticator app understands.
const crypto = require('crypto');

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const STEP = 30;
const DIGITS = 6;

function base32Encode(buf) {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

function base32Decode(str) {
  const clean = String(str || '').toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const out = [];
  for (const ch of clean) {
    value = (value << 5) | B32.indexOf(ch);
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

/** 160-bit random secret, base32 encoded (what the authenticator app stores). */
function generateSecret() {
  return base32Encode(crypto.randomBytes(20));
}

function hotp(secret, counter) {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac('sha1', base32Decode(secret)).update(msg).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const bin =
    ((hmac[offset] & 0x7f) << 24) |
    (hmac[offset + 1] << 16) |
    (hmac[offset + 2] << 8) |
    hmac[offset + 3];
  return String(bin % 10 ** DIGITS).padStart(DIGITS, '0');
}

const currentStep = (now = Date.now()) => Math.floor(now / 1000 / STEP);

/**
 * Checks a code against the current step ±`window` steps (clock drift).
 * Returns the matching step number, or null. The caller stores the step and
 * rejects anything <= the last used one, so a code can't be replayed.
 */
function verifyTotp(secret, code, { window = 1, now = Date.now() } = {}) {
  const given = String(code || '').replace(/\s/g, '');
  if (!/^\d{6}$/.test(given) || !secret) return null;
  const step = currentStep(now);
  let match = null;
  for (let i = -window; i <= window; i += 1) {
    const expected = hotp(secret, step + i);
    // constant-time compare; keep looping so timing doesn't reveal which step matched
    if (crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(given)) && match === null) {
      match = step + i;
    }
  }
  return match;
}

function otpauthUrl({ secret, account, issuer = 'Jaipurio' }) {
  const label = encodeURIComponent(`${issuer}:${account}`);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=${DIGITS}&period=${STEP}`;
}

module.exports = { generateSecret, verifyTotp, otpauthUrl, hotp, currentStep, base32Decode };
