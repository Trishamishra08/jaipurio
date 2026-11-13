// Run: npm test   (no database — the User model and activity log are stubbed)
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const bcrypt = require('bcryptjs');

const resolve = (p) => require.resolve(path.join(__dirname, '..', p));
const stub = (file, exports) => {
  require.cache[resolve(file)] = { id: resolve(file), filename: resolve(file), loaded: true, exports };
};

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const { generateSecret, hotp, currentStep } = require('../utils/totp');

let current; // the "database row" the stub returns
stub('models/userModel.js', {
  findOne: () => ({ select: async () => current }),
});
stub('models/loginActivityModel.js', { create: async () => ({}) });
stub('services/otpService.js', { sendSmsOtp: async () => ({ success: true }) });

const { login } = require('../controllers/userController');

const makeAdmin = async (over = {}) => ({
  id: 'a1',
  _id: 'a1',
  name: 'Admin',
  email: 'admin@jaipurio.in',
  role: 'admin',
  password: await bcrypt.hash('correct-horse', 4),
  twoFactorEnabled: true,
  twoFactorSecret: generateSecret(),
  twoFactorLastStep: 0,
  twoFactorFails: 0,
  saved: 0,
  async save() {
    this.saved += 1;
  },
  ...over,
});

const call = async (body) => {
  const res = {
    code: 200,
    body: null,
    status(c) {
      this.code = c;
      return this;
    },
    json(b) {
      this.body = b;
      return this;
    },
  };
  let err = null;
  await login({ body, headers: {}, ip: '1.1.1.1', get: () => '' }, res, (e) => {
    err = e;
  });
  return { res, err };
};

test('2FA off: password alone still signs in', async () => {
  current = await makeAdmin({ twoFactorEnabled: false });
  const { res } = await call({ email: 'admin@jaipurio.in', password: 'correct-horse' });
  assert.equal(res.code, 200);
  assert.ok(res.body.data.token);
});

test('2FA on: right password but no code asks for the code, no token', async () => {
  current = await makeAdmin();
  const { res } = await call({ email: 'admin@jaipurio.in', password: 'correct-horse' });
  assert.equal(res.code, 401);
  assert.equal(res.body.requires2fa, true);
  assert.equal(res.body.data, undefined);
});

test('2FA on: wrong code is rejected, no token', async () => {
  current = await makeAdmin();
  const { res } = await call({ email: 'admin@jaipurio.in', password: 'correct-horse', totp: '000000' });
  assert.equal(res.code, 401);
  assert.equal(res.body.data, undefined);
  assert.equal(current.twoFactorFails, 1);
});

test('2FA on: right code signs in, and the same code cannot be used twice', async () => {
  current = await makeAdmin();
  const code = hotp(current.twoFactorSecret, currentStep());
  const first = await call({ email: 'admin@jaipurio.in', password: 'correct-horse', totp: code });
  assert.equal(first.res.code, 200);
  assert.ok(first.res.body.data.token);
  const replay = await call({ email: 'admin@jaipurio.in', password: 'correct-horse', totp: code });
  assert.equal(replay.res.code, 401);
  assert.equal(replay.res.body.data, undefined);
});

test('2FA on: wrong password never reaches the code step', async () => {
  current = await makeAdmin();
  const { res, err } = await call({ email: 'admin@jaipurio.in', password: 'nope', totp: hotp(current.twoFactorSecret, currentStep()) });
  assert.equal(res.body, null);
  assert.equal(err.message, 'Invalid email or password');
});

test('2FA on: 5 wrong codes lock the account, even a correct code is refused', async () => {
  current = await makeAdmin();
  for (let i = 0; i < 5; i += 1) await call({ email: 'admin@jaipurio.in', password: 'correct-horse', totp: '111111' });
  assert.ok(current.twoFactorLockUntil > new Date());
  const good = hotp(current.twoFactorSecret, currentStep());
  const { res } = await call({ email: 'admin@jaipurio.in', password: 'correct-horse', totp: good });
  assert.equal(res.code, 429);
  assert.equal(res.body.data, undefined);
});

test('2FA does not affect non-admin roles', async () => {
  current = await makeAdmin({ role: 'user' });
  const { res } = await call({ email: 'admin@jaipurio.in', password: 'correct-horse' });
  assert.equal(res.code, 200);
});
