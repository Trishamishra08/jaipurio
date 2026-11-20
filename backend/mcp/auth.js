/** Admin checks for the Claude connector. */
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const { verifyTotp } = require('../utils/totp');
const { ACCESS_TTL, GRANTABLE } = require('./config');
const { sign, verify, passwordFingerprint } = require('./crypto');

/** Load an active admin by id. Returns { user, pv } or null. */
const loadAdmin = async (id) => {
  let user;
  try {
    user = await User.findById(id).select('+password');
  } catch {
    return null;
  }
  if (!user || user.role !== 'admin' || user.isBlocked || !user.password) return null;
  return { user, pv: passwordFingerprint(user.password) };
};

/**
 * Email + password (+ authenticator code when the admin turned 2FA on).
 * Returns { admin } or { error, needs2fa }.
 */
const checkAdminLogin = async (email, password, totp) => {
  const emailNorm = String(email || '').trim().toLowerCase();
  if (!emailNorm || !password) return { error: 'Enter your admin email and password.' };
  const user = await User.findOne({ email: emailNorm }).select(
    '+password +twoFactorSecret +twoFactorLastStep +twoFactorFails +twoFactorLockUntil'
  );
  const ok = user && user.password && (await bcrypt.compare(String(password), user.password));
  if (!ok) return { error: 'Wrong email or password.' };
  if (user.role !== 'admin' || user.isBlocked) return { error: 'This account is not an active admin.' };
  if (user.twoFactorEnabled && user.twoFactorSecret) {
    const code = String(totp || '').trim();
    if (!code) return { error: 'Enter the 6-digit code from your authenticator app.', needs2fa: true };
    if (user.twoFactorLockUntil && user.twoFactorLockUntil > new Date()) {
      return { error: 'Too many wrong codes. Try again in a few minutes.', needs2fa: true };
    }
    const step = verifyTotp(user.twoFactorSecret, code);
    if (step === null || step <= (user.twoFactorLastStep || 0)) {
      user.twoFactorFails = (user.twoFactorFails || 0) + 1;
      if (user.twoFactorFails >= 5) {
        user.twoFactorLockUntil = new Date(Date.now() + 10 * 60 * 1000);
        user.twoFactorFails = 0;
      }
      await user.save();
      return { error: 'Invalid authentication code.', needs2fa: true };
    }
    user.twoFactorLastStep = step;
    user.twoFactorFails = 0;
    user.twoFactorLockUntil = undefined;
    await user.save();
  }
  return { admin: { user, pv: passwordFingerprint(user.password) } };
};

const issueAccessToken = (userId, pv, abilities, cid) =>
  sign({ typ: 'access', sub: String(userId), pv, ab: abilities, cid }, ACCESS_TTL);

const revoked = (jti) =>
  String(process.env.MCP_REVOKED_TOKENS || '')
    .split(',')
    .map((s) => s.trim())
    .includes(jti);

/** Bearer token -> { user, abilities, jti, cid } or null. */
const authenticate = async (token) => {
  const t = verify(token, 'access');
  if (!t || revoked(t.jti)) return null;
  const admin = await loadAdmin(t.sub);
  if (!admin || admin.pv !== t.pv) return null;
  const abilities = (Array.isArray(t.ab) ? t.ab : []).filter((a) => GRANTABLE.includes(a));
  return { user: admin.user, abilities, jti: t.jti, cid: t.cid };
};

const bearerFrom = (req) => {
  const h = String(req.headers.authorization || '');
  return h.toLowerCase().startsWith('bearer ') ? h.slice(7).trim() : '';
};

module.exports = { loadAdmin, checkAdminLogin, issueAccessToken, authenticate, bearerFrom };
